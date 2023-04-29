const request = require('supertest')
const { JEST_TIMEOUT } = require('./../helpers')
const { setupStrapi, stopStrapi } = require('./../helpers/strapi')

const { createUser } = require('../user/user.factory')
const { createChat } = require('../chat/chat.factory')

jest.setTimeout(JEST_TIMEOUT)

beforeAll(async () => {
  await setupStrapi()
})

afterAll(async () => {
  await stopStrapi()
})

describe('Chat', () => {
  let primaryUser1
  let primaryUserJwt1
  let primaryManager1
  let primaryManagerJwt1

  beforeAll(async () => {
    const [user, userJwt] = await createUser({ type: 'authenticated' })
    const [manager, managerJwt] = await createUser({ type: 'manager' })

    primaryUser1 = user
    primaryUserJwt1 = userJwt
    primaryManager1 = manager
    primaryManagerJwt1 = managerJwt

    await createChat({ users: [primaryUser1.id, primaryManager1.id] })
    await createChat({ users: [primaryUser1.id] })
    await createChat({ users: [] })
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

  it('should manager user be able to get chats', async () => {
    await request(strapi.server.httpServer)
      .get(`/api/users/me/chats`)
      .set('accept', 'application/json')
      .set('Content-Type', 'application/json')
      .set('Authorization', `Bearer ${primaryManagerJwt1}`)
      .expect('Content-Type', /json/)
      .expect(200)
      .then(({ body: { data } }) => {
        expect(data).toHaveLength(1)
      })
  })
})
