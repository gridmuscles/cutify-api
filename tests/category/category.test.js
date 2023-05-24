const request = require('supertest')
const { JEST_TIMEOUT } = require('./../helpers')
const { setupStrapi, stopStrapi } = require('./../helpers/strapi')

const { createCategory } = require('../category/category.factory')
const { createUser } = require('../user/user.factory')

jest.setTimeout(JEST_TIMEOUT)

beforeAll(async () => {
  await setupStrapi()
})

afterAll(async () => {
  await stopStrapi()
})

describe('Categories', () => {
  beforeAll(async () => {
    await createCategory({ seo: { keywords: 'a,b,c' } })
  })

  it.each([
    { type: 'public', expectedLength: 1 },
    { type: 'authenticated', expectedLength: 1 },
    { type: 'manager', expectedLength: 1 },
    { type: 'moderator', expectedLength: 1 },
  ])(
    'should $type user be able to get cities',
    async ({ type, expectedLength }) => {
      const [, jwt] = await createUser({ type })

      const req = request(strapi.server.httpServer)
        .get(`/api/categories`)
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
          expect(data[0].attributes.seo.keywords).toBe('a,b,c')
        })
    }
  )
})
