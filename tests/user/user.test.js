const request = require('supertest')
const { JEST_TIMEOUT } = require('./../helpers')
const {
  updatePluginStore,
  setupStrapi,
  stopStrapi,
  responseHasError,
} = require('../helpers/strapi')
const { createUser, mockUserData } = require('./user.factory')

jest.setTimeout(JEST_TIMEOUT)

beforeAll(async () => {
  await setupStrapi()
})

afterAll(async () => {
  await stopStrapi()
})

describe('Users', () => {
  let primaryUser

  beforeAll(async () => {
    const [user] = await createUser({ type: 'authenticated' })
    primaryUser = user
  })

  it('should login user and return jwt token', async () => {
    const jwt = strapi.plugins['users-permissions'].services.jwt.issue({
      id: primaryUser.id,
    })

    await request(strapi.server.httpServer)
      .post('/api/auth/local')
      .set('accept', 'application/json')
      .set('Content-Type', 'application/json')
      .send({
        identifier: primaryUser.email,
        password: mockUserData().password,
      })
      .expect('Content-Type', /json/)
      .expect(200)
      .then(async (data) => {
        expect(data.body.jwt).toBeDefined()
        const verified = await strapi.plugins[
          'users-permissions'
        ].services.jwt.verify(data.body.jwt)
        expect(data.body.jwt === jwt || !!verified).toBe(true)
      })
  })

  it('should return authenticated user', async () => {
    const jwt = strapi.plugins['users-permissions'].services.jwt.issue({
      id: primaryUser.id,
    })

    await request(strapi.server.httpServer)
      .get('/api/users/me')
      .set('accept', 'application/json')
      .set('Content-Type', 'application/json')
      .set('Authorization', 'Bearer ' + jwt)
      .expect('Content-Type', /json/)
      .expect(200)
      .then((data) => {
        expect(data.body).toBeDefined()
        expect(data.body.id).toBe(primaryUser.id)
        expect(data.body.username).toBe(primaryUser.username)
        expect(data.body.email).toBe(primaryUser.email)
      })
  })

  it('should unconfirmed user is able to login', async () => {
    await updatePluginStore('users-permissions', 'advanced', {
      email_confirmation: true,
    })

    const [user] = await createUser({ type: 'authenticated', confirmed: false })

    await request(strapi.server.httpServer)
      .post('/api/auth/local')
      .set('accept', 'application/json')
      .set('Content-Type', 'application/json')
      .send({ identifier: user.email, password: mockUserData().password })
      .expect('Content-Type', /json/)
      .expect(200)
      .then(({ body: { jwt, user } }) => {
        expect(jwt).toBeDefined()
        expect(user).toBeDefined()
      })

    await updatePluginStore('users-permissions', 'advanced', {
      email_confirmation: false,
    })
  })

  it('should user be able to recover the password', async () => {
    const emailSendMock = (strapi.plugin('email').service('email').send = jest
      .fn()
      .mockReturnValue(true))

    const [user] = await createUser({ type: 'authenticated', confirmed: false })

    await request(strapi.server.httpServer)
      .post('/api/auth/forgot-password')
      .set('accept', 'application/json')
      .set('Content-Type', 'application/json')
      .send({ email: user.email })
      .expect('Content-Type', /json/)
      .expect(200)

    expect(emailSendMock).toBeCalledTimes(1)
    expect(emailSendMock).toHaveBeenCalledWith(
      expect.objectContaining({
        html: expect.stringContaining('http://localhost:3000'),
      })
    )
  })

  it('should register, send email with confirmation link, link should confirm account', async () => {
    await updatePluginStore('users-permissions', 'advanced', {
      allow_register: true,
      email_confirmation: true,
    })

    const emailSendMock = (strapi.plugin('email').service('email').send = jest
      .fn()
      .mockReturnValue(true))

    const userData = mockUserData()

    const newUser = await request(strapi.server.httpServer)
      .post('/api/auth/local/register')
      .set('accept', 'application/json')
      .set('Content-Type', 'application/json')
      .send({ ...userData }) // passing confirmed should not work
      .expect('Content-Type', /json/)
      .expect(200)
      .then((response) => {
        expect(response.body.user.username).toBe(userData.username)
        expect(response.body.user.email).toBe(userData.email)
        return response.body.user
      })

    let user = await strapi.plugins['users-permissions'].services.user.fetch(
      newUser.id
    )

    expect(user.username).toBe(userData.username)
    expect(user.email).toBe(userData.email)

    expect(user.confirmed).toBe(false)

    await request(strapi.server.httpServer)
      .post('/api/auth/local')
      .set('accept', 'application/json')
      .set('Content-Type', 'application/json')
      .send({ identifier: user.email, password: userData.password })
      .expect('Content-Type', /json/)
      .expect(400)
      .then((data) => {
        expect(responseHasError('ApplicationError', data.body)).toBe(true)
      })

    expect(emailSendMock).toBeCalledTimes(1)
    const confirmRegEx = /A?confirmation=[^&|\s<"]+&*/g
    const confirmationLink =
      emailSendMock.mock.calls[0][0].text?.match(confirmRegEx)?.[0]

    await request(strapi.server.httpServer)
      .get(`/api/auth/email-confirmation?${confirmationLink}`)
      .expect(302)

    user = await strapi.plugins['users-permissions'].services.user.fetch(
      newUser.id
    )

    expect(user.confirmed).toBe(true)

    await request(strapi.server.httpServer)
      .post('/api/auth/local')
      .set('accept', 'application/json')
      .set('Content-Type', 'application/json')
      .send({ identifier: user.email, password: userData.password })
      .expect('Content-Type', /json/)
      .expect(200)
      .then((data) => {
        expect(data.body.jwt).toBeDefined()
      })

    await updatePluginStore('users-permissions', 'advanced', {
      email_confirmation: false,
    })
  })
})
