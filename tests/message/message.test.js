const request = require('supertest')
const { JEST_TIMEOUT } = require('./../helpers')
const { setupStrapi, stopStrapi } = require('./../helpers/strapi')

const { createUser } = require('../user/user.factory')
const { createChat, getChatById } = require('../chat/chat.factory')
const { createMessage } = require('../message/message.factory')
const { createLocation } = require('../location/location.factory')
const { createOrganization } = require('../organization/organization.factory')

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
  let primaryOrganization
  let primaryLocation

  beforeAll(async () => {
    const [user, userJwt] = await createUser({ type: 'authenticated' })
    const [manager, managerJwt] = await createUser({ type: 'manager' })

    primaryUser1 = user
    primaryUserJwt1 = userJwt
    primaryManager1 = manager
    primaryManagerJwt1 = managerJwt

    primaryOrganization = await createOrganization()
    primaryLocation = await createLocation({
      organization: primaryOrganization.id,
      isChatAvailable: true,
      managers: [primaryManager1.id],
    })
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
        expect(data.attributes.createdAt).not.toBe(shadowMessage.createdAt)
      })

    const updatedChat = await getChatById(chat.id)
    expect(updatedChat.messages).toHaveLength(2)
  })

  it('should manager user wich related to location be able to mark chat as read', async () => {
    const chat = await createChat({
      users: [primaryUser1.id],
      location: primaryLocation.id,
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

  it('should authenticated user be able to create a chat message', async () => {
    const chat = await createChat({
      users: [primaryUser1.id],
      location: primaryLocation.id,
    })

    await request(strapi.server.httpServer)
      .post(`/api/messages/chat/${chat.id}`)
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
        expect(data.attributes.user.data.attributes.name).toBe(
          primaryUser1.name
        )
        expect(data.attributes.chat.data.id).toBe(chat.id)
      })
  })

  it('should not authenticated user be able to create a chat message if location chat is disabled', async () => {
    const location = await createLocation({
      isChatAvailable: false,
      managers: [primaryManager1.id],
    })

    const chat = await createChat({
      users: [primaryUser1.id],
      location: location.id,
    })

    await request(strapi.server.httpServer)
      .post(`/api/messages/chat/${chat.id}`)
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

  it('should not authenticated user be able to create a chat message in the elses chat', async () => {
    const chat = await createChat({
      users: [],
    })

    await request(strapi.server.httpServer)
      .post(`/api/messages/chat/${chat.id}`)
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

  it('should manager user be able to create a chat message in own location chat', async () => {
    const location = await createLocation({
      isChatAvailable: true,
      managers: [primaryManager1.id],
    })

    const chat = await createChat({
      users: [primaryUser1.id],
      location: location.id,
    })

    await request(strapi.server.httpServer)
      .post(`/api/messages/chat/${chat.id}`)
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
        expect(data.attributes.user.data.attributes.name).toBe(
          primaryManager1.name
        )
        expect(data.attributes.chat.data.id).toBe(chat.id)
      })
  })

  it('should not manager user be able to create a chat message if elses location', async () => {
    const location = await createLocation({
      isChatAvailable: true,
      managers: [],
    })

    const chat = await createChat({
      users: [primaryUser1.id],
      location: location.id,
    })

    await request(strapi.server.httpServer)
      .post(`/api/messages/chat/${chat.id}`)
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
