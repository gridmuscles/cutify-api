const request = require('supertest')
const { JEST_TIMEOUT } = require('./../helpers')
const { setupStrapi, stopStrapi } = require('./../helpers/strapi')

const { createUser } = require('../user/user.factory')
const { createLocation } = require('../location/location.factory')
const { createChat } = require('../chat/chat.factory')

jest.setTimeout(JEST_TIMEOUT)

beforeAll(async () => {
  await setupStrapi()
})

afterAll(async () => {
  await stopStrapi()
})

describe('Locations', () => {
  let authenticatedUser
  let authenticatedUserJwt
  let managerUser
  let managerUserJwt

  let primaryLocation

  beforeAll(async () => {
    const [user, jwt] = await createUser({ type: 'authenticated' })
    authenticatedUser = user
    authenticatedUserJwt = jwt

    const [manager, jwt2] = await createUser({ type: 'manager' })
    managerUser = manager
    managerUserJwt = jwt2

    primaryLocation = await createLocation({
      isChatAvailable: true,
      managers: [manager.id],
    })
  })

  it.each([
    { type: 'public' },
    { type: 'authenticated' },
    { type: 'manager' },
    { type: 'moderator' },
  ])(
    'should not $type user be able to get list of location',
    async ({ type }) => {
      const [, jwt] = await createUser({ type })

      const req = request(strapi.server.httpServer)
        .get(`/api/locations`)
        .set('accept', 'application/json')
        .set('Content-Type', 'application/json')

      if (jwt) {
        req.set('Authorization', `Bearer ${jwt}`)
      }

      await req.expect('Content-Type', /json/).expect(400)
    }
  )

  it.each([
    { type: 'public' },
    { type: 'authenticated' },
    { type: 'manager' },
    { type: 'moderator' },
  ])(
    'should not $type user be able to get single location',
    async ({ type }) => {
      const [, jwt] = await createUser({ type })

      const req = request(strapi.server.httpServer)
        .get(`/api/locations/${primaryLocation.id}`)
        .set('accept', 'application/json')
        .set('Content-Type', 'application/json')

      if (jwt) {
        req.set('Authorization', `Bearer ${jwt}`)
      }

      await req.expect('Content-Type', /json/).expect(400)
    }
  )

  it('should authenticated user be able to create a chat for location', async () => {
    const smsSendMock = (strapi.services['api::sms.sms'].sendSMS = jest
      .fn()
      .mockReturnValue([]))

    await request(strapi.server.httpServer)
      .post(`/api/locations/${primaryLocation.id}/chats`)
      .set('accept', 'application/json')
      .set('Content-Type', 'application/json')
      .set('Authorization', `Bearer ${authenticatedUserJwt}`)
      .expect('Content-Type', /json/)
      .expect(200)
      .then(({ body: { data } }) => {
        expect(data.attributes.messages.data).toHaveLength(0)
        expect(data.attributes.users.data).toHaveLength(1)
        expect(data.attributes.location.data.id).toBe(primaryLocation.id)
        expect(data.attributes.users.data[0].attributes.name).toBe(
          authenticatedUser.name
        )
      })

    expect(smsSendMock).toBeCalledTimes(1)

    const { phoneNumbers } = smsSendMock.mock.calls[0][0]
    expect(phoneNumbers).toContain(managerUser.phone)
  })

  it('should not authenticated user be able to create a chat for location with disabled chat option', async () => {
    const location = await createLocation({
      managers: [managerUser.id],
      isChatAvailable: false,
    })

    await request(strapi.server.httpServer)
      .post(`/api/locations/${location.id}/chats`)
      .set('accept', 'application/json')
      .set('Content-Type', 'application/json')
      .set('Authorization', `Bearer ${authenticatedUserJwt}`)
      .expect('Content-Type', /json/)
      .expect(400)
  })

  it('should not authenticated user be able to create a second chat for location', async () => {
    await createChat({
      users: [authenticatedUser.id],
      location: primaryLocation.id,
    })

    await request(strapi.server.httpServer)
      .post(`/api/locations/${primaryLocation.id}/chats`)
      .set('accept', 'application/json')
      .set('Content-Type', 'application/json')
      .set('Authorization', `Bearer ${authenticatedUserJwt}`)
      .expect('Content-Type', /json/)
      .expect(400)
  })

  it('should not manager user be able to create a chat for location', async () => {
    await request(strapi.server.httpServer)
      .post(`/api/locations/${primaryLocation.id}/chats`)
      .set('accept', 'application/json')
      .set('Content-Type', 'application/json')
      .set('Authorization', `Bearer ${managerUserJwt}`)
      .expect('Content-Type', /json/)
      .expect(403)
  })
})
