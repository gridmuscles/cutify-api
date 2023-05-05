const request = require('supertest')
const { JEST_TIMEOUT } = require('./../helpers')
const { setupStrapi, stopStrapi } = require('./../helpers/strapi')

const { createCategory } = require('../category/category.factory')
const { createOrganization } = require('../organization/organization.factory')
const { createUser } = require('../user/user.factory')
const { createReview } = require('../review/review.factory')

jest.setTimeout(JEST_TIMEOUT)

beforeAll(async () => {
  await setupStrapi()
})

afterAll(async () => {
  await stopStrapi()
})

describe('Organizations', () => {
  let primaryOrganization
  let primaryUserJwt

  beforeAll(async () => {
    const [user, jwt] = await createUser({ type: 'authenticated' })
    primaryUserJwt = jwt

    const category = await createCategory()
    primaryOrganization = await createOrganization({
      categories: [category.id],
    })

    await createReview({ organization: primaryOrganization.id, user: user.id })
  })

  it.each([
    { type: 'public', expectedLength: 1 },
    { type: 'authenticated', expectedLength: 1 },
    { type: 'manager', expectedLength: 1 },
  ])(
    'should $type user be able to get cities',
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
        })
    }
  )

  it('should guest be able to get organization reviews', async () => {
    await request(strapi.server.httpServer)
      .get(`/api/organizations/${primaryOrganization.id}/reviews`)
      .set('accept', 'application/json')
      .set('Content-Type', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
      .then(({ body: { data } }) => {
        expect(data).toHaveLength(1)
        expect(data[0].attributes.organization.data.id).toBe(
          primaryOrganization.id
        )
        expect(
          data[0].attributes.organization.data.attributes.categories
        ).toBeUndefined()
        expect(data[0].attributes.user).toBeUndefined()
      })
  })

  it('should authenticated user be able to get organization reviews', async () => {
    await request(strapi.server.httpServer)
      .get(`/api/organizations/${primaryOrganization.id}/reviews`)
      .set('accept', 'application/json')
      .set('Content-Type', 'application/json')
      .set('Authorization', `Bearer ${primaryUserJwt}`)
      .expect('Content-Type', /json/)
      .expect(200)
      .then(({ body: { data } }) => {
        expect(data).toHaveLength(1)
        expect(data[0].attributes.organization.data.id).toBe(
          primaryOrganization.id
        )
        expect(
          data[0].attributes.organization.data.attributes.categories
        ).toBeUndefined()
        expect(data[0].attributes.user).toBeUndefined()
      })
  })
})
