const request = require('supertest')
const { JEST_TIMEOUT } = require('./../helpers')
const {
  updatePluginStore,
  setupStrapi,
  stopStrapi,
  responseHasError,
} = require('../helpers/strapi')
const { createUser, mockUserData } = require('./user.factory')
const { createChat } = require('../chat/chat.factory')
const { createPromotion } = require('../promotion/promotion.factory')
const { createOrganization } = require('../organization/organization.factory')
const { createCategory } = require('../category/category.factory')
const { createCoupon } = require('../coupon/coupon.factory')
const { createMessage } = require('../message/message.factory')

jest.setTimeout(JEST_TIMEOUT)

beforeAll(async () => {
  await setupStrapi()
})

afterAll(async () => {
  await stopStrapi()
})

describe('Users', () => {
  describe('Auth', () => {
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

      const [user] = await createUser({
        type: 'authenticated',
        confirmed: false,
      })

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

      const [user] = await createUser({
        type: 'authenticated',
        confirmed: false,
      })

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

  describe('Chats', () => {
    let primaryUser1
    let primaryUserJwt1
    let primaryManager1
    let primaryManagerJwt1
    let primaryPromotion
    let primaryOrganization

    beforeAll(async () => {
      const [user, userJwt] = await createUser({ type: 'authenticated' })
      const [manager, managerJwt] = await createUser({ type: 'manager' })

      primaryUser1 = user
      primaryUserJwt1 = userJwt
      primaryManager1 = manager
      primaryManagerJwt1 = managerJwt

      primaryOrganization = await createOrganization({
        managers: [primaryManager1.id],
      })
      primaryPromotion = await createPromotion({
        organization: primaryOrganization.id,
        isChatAvailable: true,
      })

      await createChat({
        users: [primaryUser1.id],
      })
      const chat = await createChat({
        users: [primaryUser1.id],
        promotion: primaryPromotion.id,
      })
      await createChat({ users: [], promotion: primaryPromotion.id })

      await createMessage({
        user: primaryUser1.id,
        chat: chat.id,
        text: 'text text',
      })
    })

    it('should authenticated user be able to get chats', async () => {
      await request(strapi.server.httpServer)
        .get(`/api/users/me/chats`)
        .set('accept', 'application/json')
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${primaryUserJwt1}`)
        .expect('Content-Type', /json/)
        .expect(200)
        .then(({ body: { data } }) => {
          expect(data).toHaveLength(2)
          expect(data[1].attributes.users.data[0].attributes.name).toBe(
            primaryUser1.name
          )
          expect(data[1].attributes.messages.data[0].attributes.text).toBe(
            'text text'
          )
        })
    })

    it('should manager user be able to get chats for the promoitons from own organization', async () => {
      await request(strapi.server.httpServer)
        .get(`/api/users/me/chats`)
        .set('accept', 'application/json')
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${primaryManagerJwt1}`)
        .expect('Content-Type', /json/)
        .expect(200)
        .then(({ body: { data } }) => {
          expect(data).toHaveLength(2)
          expect(data[0].attributes.messages.data[0].attributes.text).toBe(
            'text text'
          )
        })
    })
  })

  describe('Coupons', () => {
    let primaryUser
    let primaryUserJwt
    let category
    let primaryOrganization
    let primaryPromotion

    beforeAll(async () => {
      const [user, jwt] = await createUser({ type: 'authenticated' })
      primaryUser = user
      primaryUserJwt = jwt

      category = await createCategory()
      primaryOrganization = await createOrganization({
        categories: [category.id],
      })
      primaryPromotion = await createPromotion({
        categories: [category.id],
        organization: primaryOrganization.id,
      })

      await createCoupon({
        promotion: primaryPromotion.id,
        email: primaryUser.email,
        user: primaryUser.id,
        uuid: '1',
      })

      await createCoupon({
        promotion: primaryPromotion.id,
        email: 'user1@gmail.com',
        uuid: '2',
      })
    })

    it('should authenticated user be able to get only own coupons', async () => {
      await request(strapi.server.httpServer)
        .get(`/api/users/me/coupons`)
        .set('accept', 'application/json')
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${primaryUserJwt}`)
        .expect('Content-Type', /json/)
        .expect(200)
        .then(({ body: { data } }) => {
          expect(data).toHaveLength(1)
          expect(data[0].attributes.uuid).toBe('1')
          expect(data[0].attributes.user).toBeUndefined()
          expect(data[0].attributes.promotion.data.attributes.title).toBe(
            primaryPromotion.title
          )
        })
    })
  })
})
