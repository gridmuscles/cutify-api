const { JEST_TIMEOUT } = require('./../helpers')
const { setupStrapi, stopStrapi } = require('./../helpers/strapi')

const { createUser } = require('../user/user.factory')
const { createChat, clearChats } = require('../chat/chat.factory')
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

describe('Chat services', () => {
  describe('User notification', () => {
    beforeEach(async () => {
      await clearChats()
    })

    it('should only 2 chat members receive notification about the new messages', async () => {
      const [user1] = await createUser({ type: 'authenticated' })
      const [user2] = await createUser({ type: 'authenticated' })
      const [user3] = await createUser({ type: 'authenticated' })
      const [manager1] = await createUser({ type: 'manager' })

      const organization = await createOrganization({
        managers: [manager1.id],
      })
      const promotion = await createPromotion({
        organization: organization.id,
        isChatAvailable: true,
      })
      const chat1 = await createChat({
        users: [user1.id, user2.id, user3.id],
        promotion: promotion.id,
      })

      await createMessage({
        user: user1.id,
        chat: chat1.id,
        createdAt: '2023-05-10T12:01:00.000Z',
      })

      await createMessage({
        user: user2.id,
        chat: chat1.id,
        createdAt: '2023-05-10T12:02:00.000Z',
      })

      await createMessage({
        user: manager1.id,
        chat: chat1.id,
        createdAt: '2023-05-10T12:03:00.000Z',
      })

      await createMessage({
        user: user3.id,
        chat: chat1.id,
        createdAt: '2023-05-10T12:04:00.000Z',
      })

      await createMessage({
        user: user1.id,
        chat: chat1.id,
        createdAt: '2023-05-10T12:05:00.000Z',
        text: null,
      })

      const recipients = await strapi
        .service('api::chat.chat')
        .getUsersToNotificate({
          messagesCreatedAtStart: '2023-05-10T12:00:00.000Z',
        })

      expect(recipients).toHaveLength(2)
      expect(recipients[0].id).toBe(manager1.id)
      expect(recipients[1].id).toBe(user2.id)
    })

    it('should all chat members except the first one receive notification about the new messages', async () => {
      const [user1] = await createUser({ type: 'authenticated' })
      const [user2] = await createUser({ type: 'authenticated' })
      const [user3] = await createUser({ type: 'authenticated' })
      const [manager1] = await createUser({ type: 'manager' })

      const organization = await createOrganization({
        managers: [manager1.id],
      })
      const promotion = await createPromotion({
        organization: organization.id,
        isChatAvailable: true,
      })
      const chat1 = await createChat({
        users: [user1.id, user2.id, user3.id],
        promotion: promotion.id,
      })

      await createMessage({
        user: user1.id,
        chat: chat1.id,
        createdAt: '2023-05-10T12:01:00.000Z',
      })

      const recipients = await strapi
        .service('api::chat.chat')
        .getUsersToNotificate({
          messagesCreatedAtStart: '2023-05-10T12:00:00.000Z',
        })

      expect(recipients).toHaveLength(3)
      expect(recipients[0].id).toBe(manager1.id)
      expect(recipients[1].id).toBe(user2.id)
      expect(recipients[2].id).toBe(user3.id)
    })

    it('should no one receive notification about the new messages', async () => {
      const [user1] = await createUser({ type: 'authenticated' })
      const [user2] = await createUser({ type: 'authenticated' })
      const [user3] = await createUser({ type: 'authenticated' })
      const [manager1] = await createUser({ type: 'manager' })

      const organization = await createOrganization({
        managers: [manager1.id],
      })
      const promotion = await createPromotion({
        organization: organization.id,
        isChatAvailable: true,
      })
      const chat1 = await createChat({
        users: [user1.id, user2.id, user3.id],
        promotion: promotion.id,
      })

      await createMessage({
        user: user1.id,
        chat: chat1.id,
        createdAt: '2023-05-10T12:01:00.000Z',
        text: null,
      })

      const recipients = await strapi
        .service('api::chat.chat')
        .getUsersToNotificate({
          messagesCreatedAtStart: '2023-05-10T12:00:00.000Z',
        })

      expect(recipients).toHaveLength(0)
    })

    it('should all app members receive notification about the new messages', async () => {
      const [user1] = await createUser({ type: 'authenticated' })
      const [user2] = await createUser({ type: 'authenticated' })
      const [user3] = await createUser({ type: 'authenticated' })
      const [manager1] = await createUser({ type: 'manager' })

      const organization = await createOrganization({
        managers: [manager1.id],
      })
      const promotion = await createPromotion({
        organization: organization.id,
        isChatAvailable: true,
      })
      const chat1 = await createChat({
        users: [user1.id, user2.id, user3.id],
        promotion: promotion.id,
      })

      await createMessage({
        user: user1.id,
        chat: chat1.id,
        createdAt: '2023-05-10T12:01:00.000Z',
      })

      const chat2 = await createChat({
        users: [user1.id],
        promotion: promotion.id,
      })

      await createMessage({
        user: manager1.id,
        chat: chat2.id,
        createdAt: '2023-05-10T12:01:00.000Z',
      })

      const recipients = await strapi
        .service('api::chat.chat')
        .getUsersToNotificate({
          messagesCreatedAtStart: '2023-05-10T12:00:00.000Z',
        })

      expect(recipients).toHaveLength(4)

      expect(recipients[0].id).toBe(manager1.id)
      expect(recipients[1].id).toBe(user2.id)
      expect(recipients[2].id).toBe(user3.id)
      expect(recipients[3].id).toBe(user1.id)
    })

    it('should no one receive notification about the new messages if last notification job launch date is later than the significant messages', async () => {
      const [user1] = await createUser({ type: 'authenticated' })
      const [user2] = await createUser({ type: 'authenticated' })
      const [user3] = await createUser({ type: 'authenticated' })
      const [manager1] = await createUser({ type: 'manager' })

      const organization = await createOrganization({
        managers: [manager1.id],
      })
      const promotion = await createPromotion({
        organization: organization.id,
        isChatAvailable: true,
      })
      const chat1 = await createChat({
        users: [user1.id, user2.id, user3.id],
        promotion: promotion.id,
      })

      await createMessage({
        user: user1.id,
        chat: chat1.id,
        createdAt: '2023-05-10T12:01:00.000Z',
      })

      await createMessage({
        user: user1.id,
        chat: chat1.id,
        createdAt: '2023-05-10T12:10:00.000Z',
        text: null,
      })

      const recipients = await strapi
        .service('api::chat.chat')
        .getUsersToNotificate({
          messagesCreatedAtStart: '2023-05-10T12:05:00.000Z',
        })

      expect(recipients).toHaveLength(0)
    })
  })
})
