const request = require('supertest')
const { JEST_TIMEOUT } = require('./../helpers')
const {
  updatePluginStore,
  setupStrapi,
  stopStrapi,
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
  let user

  beforeAll(async () => {
    user = await createUser()
  })

  it('should login user and return jwt token', async () => {
    const jwt = strapi.plugins['users-permissions'].services.jwt.issue({
      id: user.id,
    })

    await request(strapi.server.httpServer)
      .post('/api/auth/local')
      .set('accept', 'application/json')
      .set('Content-Type', 'application/json')
      .send({ identifier: user.email, password: mockUserData().password })
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
      id: user.id,
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
        expect(data.body.id).toBe(user.id)
        expect(data.body.username).toBe(user.username)
        expect(data.body.email).toBe(user.email)
      })
  })

  it('should allow register users', async () => {
    await request(strapi.server.httpServer)
      .post('/api/auth/local/register')
      .set('accept', 'application/json')
      .set('Content-Type', 'application/json')
      .send({ ...mockUserData() })
      .expect('Content-Type', /json/)
      .expect(200)
      .then(({ body: { jwt, user } }) => {
        expect(jwt).toBeDefined()
        expect(user).toBeDefined()
      })
  })

  it('should unconfirmed user is able to login', async () => {
    await updatePluginStore('users-permissions', 'advanced', {
      email_confirmation: true,
    })

    const user = await createUser({ confirmed: false })

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
})

// describe('Users: Email confirmation', () => {
//   beforeAll(async () => {
//     await updatePluginStore('users-permissions', 'advanced', {
//       email_confirmation: true,
//     })
//     await grantPrivilege(
//       2,
//       'plugin::users-permissions.controllers.auth.emailConfirmation'
//     )
//   })

//   afterAll(async () => {
//     await updatePluginStore('users-permissions', 'advanced', {
//       email_confirmation: false,
//     })
//   })

//   it('should register, send email with confirmation link, link should confirm account', async () => {
//     const newUser = await request(strapi.server.httpServer)
//       .post('/api/auth/local/register')
//       .set('accept', 'application/json')
//       .set('Content-Type', 'application/json')
//       .send({ ...userData }) // passing confirmed should not work
//       .expect('Content-Type', /json/)
//       .expect(200)
//       .then((response) => {
//         expect(response.body.user.username).toBe(userData.username)
//         expect(response.body.user.email).toBe(userData.email)
//         return response.body.user
//       })

//     let user = await strapi.plugins['users-permissions'].services.user.fetch(
//       newUser.id
//     )

//     expect(user.username).toBe(userData.username)
//     expect(user.email).toBe(userData.email)

//     expect(user.confirmed).toBe(false)

//     await request(strapi.server.httpServer)
//       .post('/api/auth/local')
//       .set('accept', 'application/json')
//       .set('Content-Type', 'application/json')
//       .send({ identifier: user.email, password: userData.password })
//       .expect('Content-Type', /json/)
//       .expect(400)
//       .then((data) => {
//         expect(responseHasError('ApplicationError', data.body)).toBe(true)
//       })

//     const emailsSent = nodemailerMock.mock.getSentMail()
//     expect(emailsSent.length).toBeGreaterThan(0)

//     const confirmRegEx = /\A?confirmation=[^&|\s<"]+&*/g

//     const confirmationLink = emailsSent.reduce((acc, curr) => {
//       return curr.text?.match(confirmRegEx)?.[0] ?? acc
//     }, '')

//     expect(confirmationLink).toBeDefined()
//     expect(confirmationLink).not.toBe('')

//     await request(strapi.server.httpServer)
//       .get(`/api/auth/email-confirmation?${confirmationLink}`)
//       .expect(302)

//     user = await strapi.plugins['users-permissions'].services.user.fetch(
//       newUser.id
//     )

//     expect(user.confirmed).toBe(true)

//     await request(strapi.server.httpServer)
//       .post('/api/auth/local')
//       .set('accept', 'application/json')
//       .set('Content-Type', 'application/json')
//       .send({ identifier: user.email, password: mockUserData().password })
//       .expect('Content-Type', /json/)
//       .expect(200)
//       .then((data) => {
//         expect(data.body.jwt).toBeDefined()
//       })
//   })
// })
