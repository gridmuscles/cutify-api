const request = require('supertest')
const { JEST_TIMEOUT } = require('./../helpers')
const { setupStrapi, stopStrapi } = require('./../helpers/strapi')

const { createCategory } = require('../category/category.factory')
const { createOrganization } = require('../organization/organization.factory')
const { createUser } = require('../user/user.factory')
const { createReview } = require('./review.factory')

jest.setTimeout(JEST_TIMEOUT)

beforeAll(async () => {
  await setupStrapi()
})

afterAll(async () => {
  await stopStrapi()
})

describe('Reviews', () => {
  let primaryUserJwt
  let category
  let organization

  beforeAll(async () => {
    const [, jwt] = await createUser({ type: 'authenticated' })
    primaryUserJwt = jwt

    category = await createCategory()
    organization = await createOrganization({
      categories: [category.id],
    })

    await createReview({ organization: organization.id })
  })

  it('should not guest be able to get all reviews wothout specified organization', async () => {
    await request(strapi.server.httpServer)
      .get(`/api/reviews`)
      .set('accept', 'application/json')
      .set('Content-Type', 'application/json')
      .expect('Content-Type', /json/)
      .expect(500)
  })

  it('should guest be able to get organization reviews', async () => {
    await request(strapi.server.httpServer)
      .get(`/api/reviews?filters[organization][id][$eq]=${organization.id}`)
      .set('accept', 'application/json')
      .set('Content-Type', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
      .then(({ body: { data } }) => {
        expect(data).toHaveLength(1)
        expect(data[0].attributes.organization.data.id).toBe(organization.id)
        expect(
          data[0].attributes.organization.data.attributes.categories
        ).toBeUndefined()
      })
  })

  it('should authenticated user be able to get organization reviews', async () => {
    await request(strapi.server.httpServer)
      .get(`/api/reviews?filters[organization][id][$eq]=${organization.id}`)
      .set('accept', 'application/json')
      .set('Content-Type', 'application/json')
      .set('Authorization', `Bearer ${primaryUserJwt}`)
      .expect('Content-Type', /json/)
      .expect(200)
      .then(({ body: { data } }) => {
        expect(data).toHaveLength(1)
        expect(data[0].attributes.organization.data.id).toBe(organization.id)
        expect(
          data[0].attributes.organization.data.attributes.categories
        ).toBeUndefined()
      })
  })
})
