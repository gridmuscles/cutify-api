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
  let category
  let organization

  beforeAll(async () => {
    category = await createCategory()
    organization = await createOrganization({
      categories: [category.id],
    })

    await createReview({ organization: organization.id })
  })

  it.each([
    { type: 'public', code: 403 },
    { type: 'authenticated', code: 403 },
    { type: 'manager', code: 403 },
    { type: 'moderator', code: 403 },
  ])('should $type user be able to get cities', async ({ type, code }) => {
    const [, jwt] = await createUser({ type })

    const req = request(strapi.server.httpServer)
      .get(`/api/reviews`)
      .set('accept', 'application/json')
      .set('Content-Type', 'application/json')

    if (jwt) {
      req.set('Authorization', `Bearer ${jwt}`)
    }

    await req.expect('Content-Type', /json/).expect(code)
  })
})
