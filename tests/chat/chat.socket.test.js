const { io: client } = require('socket.io-client')
const request = require('supertest')

const { JEST_TIMEOUT } = require('./../helpers')
const { setupStrapi, stopStrapi } = require('./../helpers/strapi')

const { createChat } = require('../chat/chat.factory')
const { createUser } = require('../user/user.factory')
const { createLocation } = require('../location/location.factory')
const { createPromotion } = require('../promotion/promotion.factory')
const { createOrganization } = require('../organization/organization.factory')

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
    let primaryUserJwt2

    let primaryManager1
    let primaryManagerJwt1

    let primaryLocation

    beforeAll((done) => {
      const { host, port } = strapi.config.get('server')

      setupStrapi()
        .then(() =>
          Promise.all([
            createUser({ type: 'authenticated' }),
            createUser({ type: 'authenticated' }),
            createUser({ type: 'manager' }),
          ])
        )
        .then(([[user1, jwt1], [, jwt2], [user3, jwt3]]) => {
          primaryUser1 = user1
          primaryUserJwt1 = jwt1
          primaryUserJwt2 = jwt2
          primaryManager1 = user3
          primaryManagerJwt1 = jwt3
        })
        .then(() =>
          createLocation({
            isChatAvailable: true,
            managers: [primaryManager1.id],
          })
        )
        .then((location) => {
          primaryLocation = location
        })
        .then(() => {
          return createChat({
            location: primaryLocation.id,
            messages: [],
            users: [primaryUser1],
          })
        })
        .then((chat) => {
          primaryChat = chat
        })
        .then(() => {
          setTimeout(done, 300)

          clientSocket1 = new client(`http://${host}:${port}/location-chats`, {
            auth: {
              token: `${primaryUserJwt1}`,
            },
          })

          clientSocket2 = new client(`http://${host}:${port}/location-chats`, {
            auth: {
              token: `${primaryUserJwt2}`,
            },
          })

          clientSocket3 = new client(`http://${host}:${port}/location-chats`, {
            auth: {
              token: `${primaryManagerJwt1}`,
            },
          })
        })
        .catch((err) => {
          console.log(err)
          done()
        })
    })

    afterAll((done) => {
      // client.close()
      clientSocket1.close()
      clientSocket2.close()
      clientSocket3.close()

      setTimeout(done, 300)
    })

    it('should authenticated user be able to receive chats', (done) => {
      createOrganization()
        .then((organization) =>
          Promise.all([
            createLocation({
              isChatAvailable: true,
              managers: [primaryManager1.id],
              organization: organization.id,
            }),
            createPromotion({ organization: organization.id }),
          ])
        )
        .then(([location, promotion]) => {
          return request(strapi.server.httpServer)
            .post(
              `/api/chats/location/${location.id}/promotion/${promotion.id}`
            )
            .set('accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${primaryUserJwt1}`)
            .expect('Content-Type', /json/)
            .expect(200)
            .then(() => {
              setTimeout(done, 1000)

              clientSocket1.on(
                'receiveChatSuccess',
                async ({ data: { attributes } }) => {
                  expect(attributes.users[0]).toBe(primaryUser1.id)
                }
              )

              clientSocket2.on('receiveChatSuccess', async () => {
                throw new Error(
                  `receiveChatMessage should not be emitted for clientSocket3`
                )
              })

              clientSocket3.on(
                'receiveChatSuccess',
                async ({ data: { attributes } }) => {
                  expect(attributes.location.data.id).toBe(primaryLocation.id)
                }
              )
            })
            .catch((err) => {
              console.log(err)
              done
            })
        })
    })

    it('should authenticated user be able to receive messages', (done) => {
      request(strapi.server.httpServer)
        .post(`/api/messages/chat/${primaryChat.id}`)
        .set('accept', 'application/json')
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${primaryUserJwt1}`)
        .send({
          data: {
            text: 'test',
          },
        })
        .expect('Content-Type', /json/)
        .expect(200)
        .then(() => {
          setTimeout(done, 1000)

          clientSocket1.on(
            'receiveChatMessageSuccess',
            async ({ data: { attributes } }) => {
              expect(attributes.text).toBe('test')
            }
          )

          clientSocket2.on('receiveChatMessageSuccess', async () => {
            throw new Error(
              `receiveChatMessage should not be emitted for clientSocket3`
            )
          })

          clientSocket3.on(
            'receiveChatMessageSuccess',
            async ({ data: { attributes } }) => {
              expect(attributes.text).toBe('test')
            }
          )
        })
        .catch((err) => {
          console.log(err)
          done()
        })
    })
  })
})
