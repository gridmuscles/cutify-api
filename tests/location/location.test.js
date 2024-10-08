const request = require('supertest')
const { JEST_TIMEOUT } = require('./../helpers')
const { setupStrapi, stopStrapi } = require('./../helpers/strapi')

const { createUser } = require('../user/user.factory')
const { createLocation } = require('../location/location.factory')

jest.setTimeout(JEST_TIMEOUT)

beforeAll(async () => {
  await setupStrapi()
})

afterAll(async () => {
  await stopStrapi()
})

describe('Locations', () => {
  let primaryLocation

  beforeAll(async () => {
    const [manager] = await createUser({ type: 'manager' })

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
})
