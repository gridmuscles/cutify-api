const { JEST_TIMEOUT } = require('./../helpers')
const { setupStrapi, stopStrapi } = require('./../helpers/strapi')

const { getNewChatMessageNotification } = require('../cron/cron.factory')

jest.setTimeout(JEST_TIMEOUT)

beforeAll(async () => {
  await setupStrapi()
})

afterAll(async () => {
  await stopStrapi()
})

describe('Cron jobs', () => {
  describe('New chat message notification', () => {
    let newChatMessageNotification

    beforeAll(async () => {
      newChatMessageNotification = await getNewChatMessageNotification()
    })

    it('should all recipients receive notification about the new messages', async () => {
      const emailSendMock = (strapi.plugin('email').service('email').send = jest
        .fn()
        .mockReturnValue(true))

      strapi.service('api::chat.chat').getUsersToNotificate = jest
        .fn()
        .mockReturnValue([
          {
            id: 16,
            email: 'tester5587@strapi.com',
            phone: '+995587',
            role: { id: 3, type: 'manager' },
          },
          {
            id: 8,
            email: 'tester1051@strapi.com',
            phone: '+991051',
            role: { id: 3, type: 'authenticated' },
          },
        ])

      await newChatMessageNotification({ strapi })

      expect(emailSendMock.mock.calls[0][0].to).toHaveLength(2)
      expect(emailSendMock.mock.calls[0][0].to[0].id).toBe(16)
      expect(emailSendMock.mock.calls[0][0].to[1].id).toBe(8)
    })
  })
})
