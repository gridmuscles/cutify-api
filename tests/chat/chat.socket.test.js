const { io: client } = require('socket.io-client')

const { JEST_TIMEOUT } = require('./../helpers')
const { setupStrapi, stopStrapi } = require('./../helpers/strapi')

const { createChat, getChatById } = require('../chat/chat.factory')
const { createUser } = require('../user/user.factory')

jest.setTimeout(JEST_TIMEOUT)

beforeAll(async () => {
  await setupStrapi()
})

afterAll(async () => {
  await stopStrapi()
})
describe('Chat', () => {
  describe('Authenticated user', () => {
    let clientSocket1
    let clientSocket2
    let clientSocket3

    let primaryChat

    let primaryUser1
    let primaryUserJwt1
    let primaryUser2
    let primaryUserJwt2
    let primaryUserJwt3

    beforeAll((done) => {
      const { host, port } = strapi.config.get('server')

      setupStrapi()
        .then(() =>
          Promise.all([
            createUser({ type: 'authenticated' }),
            createUser({ type: 'authenticated' }),
            createUser({ type: 'authenticated' }),
          ])
        )
        .then(([[user1, jwt1], [user2, jwt2], [, jwt3]]) => {
          primaryUser1 = user1
          primaryUserJwt1 = jwt1
          primaryUser2 = user2
          primaryUserJwt2 = jwt2
          primaryUserJwt3 = jwt3
        })
        .then(() => {
          return createChat({
            messages: [],
            users: [primaryUser1, primaryUser2],
          })
        })
        .then((chat) => {
          primaryChat = chat
        })
        .then(() => {
          setTimeout(done, 300)

          clientSocket1 = new client(`http://${host}:${port}/promotion-chats`, {
            auth: {
              token: `${primaryUserJwt1}`,
            },
          })

          clientSocket2 = new client(`http://${host}:${port}/promotion-chats`, {
            auth: {
              token: `${primaryUserJwt2}`,
            },
          })

          clientSocket3 = new client(`http://${host}:${port}/promotion-chats`, {
            auth: {
              token: `${primaryUserJwt3}`,
            },
          })
        })
    })

    afterAll((done) => {
      // client.close()
      clientSocket1.close()
      clientSocket2.close()
      clientSocket3.close()

      setTimeout(done, 300)
    })

    it('should authenticated user be able to send messages into the own chat', (done) => {
      clientSocket1.emit('sendChatMessage', {
        data: {
          chatId: primaryChat.id,
          text: 'test',
        },
      })

      clientSocket1.on(
        'receiveChatMessageSuccess',
        async ({ data: { attributes } }) => {
          expect(attributes.text).toBe('test')
          try {
            const chat = await getChatById(primaryChat.id)
            expect(chat.messages).toHaveLength(1)
          } catch (err) {
            console.log(err)
          }
        }
      )

      clientSocket2.on(
        'receiveChatMessageSuccess',
        async ({ data: { attributes } }) => {
          expect(attributes.text).toBe('test')
          try {
            const chat = await getChatById(primaryChat.id)
            expect(chat.messages).toHaveLength(1)
          } catch (err) {
            console.log(err)
          }
        }
      )

      clientSocket3.on('receiveChatMessageSuccess', async () => {
        throw new Error(
          `receiveChatMessage should not be emitted for clientSocket3`
        )
      })

      setTimeout(done, 300)
    })

    it('should authenticated user is not be able to send messages into the someone elses chat', (done) => {
      setTimeout(done, 300)

      clientSocket3.emit('sendChatMessage', {
        data: {
          chatId: primaryChat.id,
          text: 'test',
        },
      })

      clientSocket1.on('receiveChatMessageSuccess', async () => {
        throw new Error(
          `receiveChatMessageSuccess should not be emitted for clientSocket1`
        )
      })

      clientSocket2.on('receiveChatMessageSuccess', async () => {
        throw new Error(
          `receiveChatMessageSuccess should not be emitted for clientSocket2`
        )
      })
    })
  })
})
