const request = require('supertest')
const { JEST_TIMEOUT } = require('./../helpers')
const { setupStrapi, stopStrapi } = require('./../helpers/strapi')

const { createCategory } = require('../category/category.factory')
const { createOrganization } = require('../organization/organization.factory')
const { createUser } = require('../user/user.factory')
const { createReview } = require('../review/review.factory')
const { createLocation } = require('../location/location.factory')

jest.setTimeout(JEST_TIMEOUT)

beforeAll(async () => {
  await setupStrapi()
})

afterAll(async () => {
  await stopStrapi()
})

describe('Organizations', () => {
  let primaryOrganization
  let primaryLocation

  beforeAll(async () => {
    const [user] = await createUser({ type: 'authenticated' })

    const category = await createCategory()

    primaryOrganization = await createOrganization({
      categories: [category.id],
    })
    primaryLocation = await createLocation({
      organization: primaryOrganization.id,
    })

    await createReview({ organization: primaryOrganization.id, user: user.id })
  })

  it.each([
    { type: 'public', expectedLength: 1 },
    { type: 'authenticated', expectedLength: 1 },
    { type: 'manager', expectedLength: 1 },
  ])(
    'should $type user be able to get organizations',
    async ({ type, expectedLength }) => {
      const [, jwt] = await createUser({ type })

      const req = request(strapi.server.httpServer)
        .get(`/api/organizations`)
        .set('accept', 'application/json')
        .set('Content-Type', 'application/json')

      if (jwt) {
        req.set('Authorization', `Bearer ${jwt}`)
      }

      await req
        .expect('Content-Type', /json/)
        .expect(200)
        .then(({ body: { data } }) => {
          expect(data).toHaveLength(expectedLength)
          expect(data[0].id).toBe(primaryOrganization.id)
          expect(data[0].attributes.locations.data[0].attributes.address).toBe(
            primaryLocation.address
          )
        })
    }
  )
})
