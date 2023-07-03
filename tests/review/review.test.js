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
  ])(
    'should $type user get $code if request all reviews',
    async ({ type, code }) => {
      const [, jwt] = await createUser({ type })

      const req = request(strapi.server.httpServer)
        .get(`/api/reviews`)
        .set('accept', 'application/json')
        .set('Content-Type', 'application/json')

      if (jwt) {
        req.set('Authorization', `Bearer ${jwt}`)
      }

      await req.expect('Content-Type', /json/).expect(code)
    }
  )

  it.each([
    { type: 'public', code: 200 },
    { type: 'authenticated', code: 200 },
    { type: 'manager', code: 200 },
    { type: 'moderator', code: 200 },
  ])(
    'should $type user get $code if request all organization reviews',
    async ({ type, code }) => {
      const [, jwt] = await createUser({ type })

      const req = request(strapi.server.httpServer)
        .get(`/api/reviews/organization/${organization.id}`)
        .set('accept', 'application/json')
        .set('Content-Type', 'application/json')

      if (jwt) {
        req.set('Authorization', `Bearer ${jwt}`)
      }

      await req.expect('Content-Type', /json/).expect(code)
    }
  )

  it.each([
    { type: 'public', code: 403 },
    { type: 'authenticated', code: 200 },
    { type: 'manager', code: 403 },
    { type: 'moderator', code: 403 },
  ])(
    'should $type user get $code when create review ',
    async ({ type, code }) => {
      const [, jwt] = await createUser({ type })

      const req = request(strapi.server.httpServer)
        .post(`/api/reviews`)
        .set('accept', 'application/json')
        .set('Content-Type', 'application/json')
        .send({
          data: {
            organization: organization.id,
            message: 'Good',
            name: 'John',
            rating: 3,
          },
        })

      if (jwt) {
        req.set('Authorization', `Bearer ${jwt}`)
      }

      await req.expect('Content-Type', /json/).expect(code)
    }
  )

  it('should authenticated user be able to create review', async () => {
    const [, jwt] = await createUser({ type: 'authenticated' })

    await request(strapi.server.httpServer)
      .post(`/api/reviews`)
      .set('accept', 'application/json')
      .set('Content-Type', 'application/json')
      .set('Authorization', `Bearer ${jwt}`)
      .send({
        data: {
          organization: organization.id,
          message: 'Good',
          name: 'John',
          rating: 3,
        },
      })
      .expect('Content-Type', /json/)
      .expect(200)
      .then(({ body: { data } }) => {
        expect(data).toBeDefined()
      })
  })
})
