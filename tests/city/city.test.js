const request = require('supertest')
const { JEST_TIMEOUT } = require('./../helpers')
const { setupStrapi, stopStrapi } = require('./../helpers/strapi')

const { createUser } = require('../user/user.factory')
const { createCity } = require('../city/city.factory')

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

    await createCity()
  })

  it('should guest be able to get only own coupons', async () => {
    await request(strapi.server.httpServer)
      .get(`/api/cities`)
      .set('accept', 'application/json')
      .set('Content-Type', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
      .then(({ body: { data } }) => {
        expect(data).toHaveLength(1)
      })
  })

  it('should authentificated user be able to get cities', async () => {
    await request(strapi.server.httpServer)
      .get(`/api/cities`)
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
