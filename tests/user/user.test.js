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
      })

      await createChat({
        users: [primaryUser1.id],
      })
      await createChat({
        users: [primaryUser1.id],
        promotion: primaryPromotion.id,
      })
      await createChat({ users: [], promotion: primaryPromotion.id })
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
        })
    })

    it('should authenticated user be able to create a chat for promotion', async () => {
      const promotion = await createPromotion({
        organization: primaryOrganization.id,
      })

      await request(strapi.server.httpServer)
        .post(`/api/users/me/chats`)
        .set('accept', 'application/json')
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${primaryUserJwt1}`)
        .send({
          data: {
            promotionId: promotion.id,
          },
        })
        .expect('Content-Type', /json/)
        .expect(200)
        .then(({ body: { data } }) => {
          expect(data.attributes.messages.data).toHaveLength(0)
          expect(data.attributes.users.data).toHaveLength(1)
          expect(data.attributes.promotion.data.id).toBe(promotion.id)
        })
    })

    it('should not authenticated user be able to create a second chat for promotion', async () => {
      await createChat({
        users: [primaryUser1.id],
        promotion: primaryPromotion.id,
      })

      await request(strapi.server.httpServer)
        .post(`/api/users/me/chats`)
        .set('accept', 'application/json')
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${primaryUserJwt1}`)
        .send({
          data: {
            promotionId: primaryPromotion.id,
          },
        })
        .expect('Content-Type', /json/)
        .expect(400)
    })

    it('should not manager user be able to create a chat for promotion', async () => {
      await request(strapi.server.httpServer)
        .post(`/api/users/me/chats`)
        .set('accept', 'application/json')
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${primaryManagerJwt1}`)
        .send({
          data: {
            promotionId: primaryPromotion.id,
          },
        })
        .expect('Content-Type', /json/)
        .expect(403)
    })

    it('should authenticated user be able to create a chat message', async () => {
      const chat = await createChat({
        users: [primaryUser1.id],
      })

      await request(strapi.server.httpServer)
        .post(`/api/users/me/chats/${chat.id}/message`)
        .set('accept', 'application/json')
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${primaryUserJwt1}`)
        .send({
          data: {
            text: 'test text',
          },
        })
        .expect('Content-Type', /json/)
        .expect(200)
        .then(({ body: { data } }) => {
          expect(data.attributes.text).toBe('test text')
          expect(data.attributes.user.data.id).toBe(primaryUser1.id)
          expect(data.attributes.chat.data.id).toBe(chat.id)
        })
    })

    it('should not authenticated user be able to create a chat message in the elses chat', async () => {
      const chat = await createChat({
        users: [],
      })

      await request(strapi.server.httpServer)
        .post(`/api/users/me/chats/${chat.id}/message`)
        .set('accept', 'application/json')
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${primaryUserJwt1}`)
        .send({
          data: {
            text: 'test text',
          },
        })
        .expect('Content-Type', /json/)
        .expect(400)
    })

    it('should manager user be able to create a chat message if own organization promotion', async () => {
      const organization = await createOrganization({
        managers: [primaryManager1.id],
      })
      const promotion = await createPromotion({
        organization: organization.id,
      })

      const chat = await createChat({
        users: [primaryUser1.id],
        promotion: promotion.id,
      })

      await request(strapi.server.httpServer)
        .post(`/api/users/me/chats/${chat.id}/message`)
        .set('accept', 'application/json')
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${primaryManagerJwt1}`)
        .send({
          data: {
            text: 'test text',
          },
        })
        .expect('Content-Type', /json/)
        .expect(200)
        .then(({ body: { data } }) => {
          expect(data.attributes.text).toBe('test text')
          expect(data.attributes.user.data.id).toBe(primaryManager1.id)
          expect(data.attributes.chat.data.id).toBe(chat.id)
        })
    })

    it('should not manager user be able to create a chat message if elses organization promotion', async () => {
      const organization = await createOrganization({
        managers: [],
      })
      const promotion = await createPromotion({
        organization: organization.id,
      })

      const chat = await createChat({
        users: [primaryUser1.id],
        promotion: promotion.id,
      })

      await request(strapi.server.httpServer)
        .post(`/api/users/me/chats/${chat.id}/message`)
        .set('accept', 'application/json')
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${primaryManagerJwt1}`)
        .send({
          data: {
            text: 'test text',
          },
        })
        .expect('Content-Type', /json/)
        .expect(400)
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
