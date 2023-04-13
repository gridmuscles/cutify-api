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

describe('Cities', () => {
  let primaryUserJwt

  beforeAll(async () => {
    const [, jwt] = await createUser()
    primaryUserJwt = jwt

    await createCategory()
  })

  it('should guest be able to get categories', async () => {
    await request(strapi.server.httpServer)
      .get(`/api/categories`)
      .set('accept', 'application/json')
      .set('Content-Type', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
      .then(({ body: { data } }) => {
        expect(data).toHaveLength(1)
      })
  })

  it('should authentificated user be able to get categories', async () => {
    await request(strapi.server.httpServer)
      .get(`/api/categories`)
      .set('accept', 'application/json')
      .set('Content-Type', 'application/json')
      .set('Authorization', `Bearer ${primaryUserJwt}`)
      .expect('Content-Type', /json/)
      .expect(200)
      .then(({ body: { data } }) => {
        expect(data).toHaveLength(1)
      })
  })
})
