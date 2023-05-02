const request = require('supertest')
const { JEST_TIMEOUT } = require('./../helpers')
const { setupStrapi, stopStrapi } = require('./../helpers/strapi')

const { createUser } = require('../user/user.factory')
const { createChat, getChatById } = require('../chat/chat.factory')
const { createMessage } = require('../message/message.factory')
const { createOrganization } = require('../organization/organization.factory')
const { createPromotion } = require('../promotion/promotion.factory')

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
  })

  it('should authenticated user be able to mark own chat as read', async () => {
    const chat = await createChat({
      users: [primaryUser1.id],
    })

    const shadowMessage = await createMessage({
      user: primaryUser1.id,
      chat: chat.id,
      text: null,
    })

    await createMessage({
      user: primaryUser1.id,
      chat: chat.id,
      text: 'text text',
    })

    await request(strapi.server.httpServer)
      .post(`/api/chats/${chat.id}/mark-as-read`)
      .set('accept', 'application/json')
      .set('Content-Type', 'application/json')
      .set('Authorization', `Bearer ${primaryUserJwt1}`)
      .expect('Content-Type', /json/)
      .expect(200)
      .then(({ body: { data } }) => {
        expect(data.id).toBe(shadowMessage.id)
        expect(data.attributes.text).toBeNull()
        expect(data.attributes.updatedAt).not.toBe(data.attributes.createdAt)
      })

    const updatedChat = await getChatById(chat.id)
    expect(updatedChat.messages).toHaveLength(2)
  })

  it('should manager user be able to mark own chat as read', async () => {
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
      .post(`/api/chats/${chat.id}/mark-as-read`)
      .set('accept', 'application/json')
      .set('Content-Type', 'application/json')
      .set('Authorization', `Bearer ${primaryManagerJwt1}`)
      .expect('Content-Type', /json/)
      .expect(200)
      .then(({ body: { data } }) => {
        expect(data.attributes.text).toBeNull()
      })

    const updatedChat = await getChatById(chat.id)
    expect(updatedChat.messages).toHaveLength(1)
  })

  it('should authenticated user not be able to mark not own chat as read', async () => {
    const chat = await createChat({
      users: [],
    })

    await request(strapi.server.httpServer)
      .post(`/api/chats/${chat.id}/mark-as-read`)
      .set('accept', 'application/json')
      .set('Content-Type', 'application/json')
      .set('Authorization', `Bearer ${primaryUserJwt1}`)
      .expect('Content-Type', /json/)
      .expect(400)

    const updatedChat = await getChatById(chat.id)
    expect(updatedChat.messages).toHaveLength(0)
  })
})
