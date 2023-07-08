const request = require('supertest')
const { JEST_TIMEOUT } = require('./../helpers')
const { setupStrapi, stopStrapi } = require('./../helpers/strapi')

const { createUser } = require('../user/user.factory')
const { createChat, getChatById, clearChats } = require('../chat/chat.factory')
const { createMessage } = require('../message/message.factory')
const { createLocation } = require('../location/location.factory')
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
  let primaryOrganization
  let primaryPromotion
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
    primaryPromotion = await createPromotion({
      organization: primaryOrganization.id,
    })
  })

  beforeEach(async () => {
    await clearChats()
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

  it('should authenticated user be able to create a chat for location and promotion', async () => {
    const smsSendMock = (strapi.services['api::sms.sms'].sendSMS = jest
      .fn()
      .mockReturnValue([]))

    await request(strapi.server.httpServer)
      .post(
        `/api/chats/location/${primaryLocation.id}/promotion/${primaryPromotion.id}`
      )
      .set('accept', 'application/json')
      .set('Content-Type', 'application/json')
      .set('Authorization', `Bearer ${primaryUserJwt1}`)
      .expect('Content-Type', /json/)
      .expect(200)
      .then(({ body: { data } }) => {
        expect(data.attributes.messages.data).toHaveLength(0)
        expect(data.attributes.users.data).toHaveLength(1)
        expect(data.attributes.location.data.id).toBe(primaryLocation.id)
        expect(data.attributes.users.data[0].attributes.name).toBe(
          primaryUser1.name
        )
      })

    expect(smsSendMock).toBeCalledTimes(1)

    const { phoneNumbers } = smsSendMock.mock.calls[0][0]
    expect(phoneNumbers).toContain(primaryManager1.phone)
  })

  it('should not authenticated user be able to create a chat for location with disabled chat option', async () => {
    const location = await createLocation({
      organization: primaryLocation,
      managers: [primaryManager1.id],
      isChatAvailable: false,
    })

    await request(strapi.server.httpServer)
      .post(
        `/api/chats/location/${location.id}/promotion/${primaryPromotion.id}`
      )
      .set('accept', 'application/json')
      .set('Content-Type', 'application/json')
      .set('Authorization', `Bearer ${primaryUserJwt1}`)
      .expect('Content-Type', /json/)
      .expect(400)
  })

  it('should not authenticated user be able to create a second chat for location and promotion', async () => {
    await createChat({
      users: [primaryUser1.id],
      location: primaryLocation.id,
      promotion: primaryPromotion.id,
    })

    await request(strapi.server.httpServer)
      .post(
        `/api/chats/location/${primaryLocation.id}/promotion/${primaryPromotion.id}`
      )
      .set('accept', 'application/json')
      .set('Content-Type', 'application/json')
      .set('Authorization', `Bearer ${primaryUserJwt1}`)
      .expect('Content-Type', /json/)
      .expect(400)
  })

  it('should not authenticated user be able to create a second chat for the same location and promotion', async () => {
    await createChat({
      users: [primaryUser1.id],
      location: primaryLocation.id,
      promotion: primaryPromotion.id,
    })

    await request(strapi.server.httpServer)
      .post(
        `/api/chats/location/${primaryLocation.id}/promotion/${primaryPromotion.id}`
      )
      .set('accept', 'application/json')
      .set('Content-Type', 'application/json')
      .set('Authorization', `Bearer ${primaryUserJwt1}`)
      .expect('Content-Type', /json/)
      .expect(400)
  })

  it('should not authenticated user be able to create a  chat for location and promotion from different orgs', async () => {
    const promotion = await createPromotion()
    const location = await createLocation()

    await request(strapi.server.httpServer)
      .post(`/api/chats/location/${location.id}/promotion/${promotion.id}`)
      .set('accept', 'application/json')
      .set('Content-Type', 'application/json')
      .set('Authorization', `Bearer ${primaryUserJwt1}`)
      .expect('Content-Type', /json/)
      .expect(400)
  })

  it('should authenticated user be able to get own chats', async () => {
    await createChat({
      users: [primaryUser1.id],
      location: primaryLocation.id,
    })

    const chat = await createChat({
      users: [primaryUser1.id],
      location: primaryLocation.id,
    })

    await createMessage({
      user: primaryUser1.id,
      chat: chat.id,
      text: 'text text',
    })

    await request(strapi.server.httpServer)
      .get(`/api/chats/user/me`)
      .set('accept', 'application/json')
      .set('Content-Type', 'application/json')
      .set('Authorization', `Bearer ${primaryUserJwt1}`)
      .expect('Content-Type', /json/)
      .expect(200)
      .then(({ body: { data } }) => {
        expect(data).toHaveLength(2)
        expect(data[1].attributes.users.data[0].attributes).toEqual({
          name: primaryUser1.name,
        })
        expect(data[1].attributes.messages.data[0].attributes.text).toBe(
          'text text'
        )
        expect(
          data[1].attributes.messages.data[0].attributes.user.data.attributes
        ).toEqual({ name: primaryUser1.name })
      })
  })

  it('should manager user be able to get chats for the promoitons from own organization', async () => {
    const chat = await createChat({
      users: [],
      location: primaryLocation.id,
    })

    await createChat({
      users: [],
      location: primaryLocation.id,
    })

    await createMessage({
      user: primaryManager1.id,
      chat: chat.id,
      text: 'text text',
    })
    await request(strapi.server.httpServer)
      .get(`/api/chats/user/me`)
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
        expect(
          data[0].attributes.messages.data[0].attributes.user.data.attributes
        ).toEqual({ name: primaryManager1.name })
      })
  })
})
