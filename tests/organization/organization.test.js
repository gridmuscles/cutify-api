const request = require('supertest')
const { JEST_TIMEOUT } = require('./../helpers')
const { setupStrapi, stopStrapi } = require('./../helpers/strapi')

const { createCategory } = require('../category/category.factory')
const { createOrganization } = require('../organization/organization.factory')
const { createUser } = require('../user/user.factory')

jest.setTimeout(JEST_TIMEOUT)

beforeAll(async () => {
  await setupStrapi()
})

afterAll(async () => {
  await stopStrapi()
})

describe('Organizations', () => {
  let primaryUser
  let primaryUserJwt
  let category

  beforeAll(async () => {
    primaryUser = await createUser()
    primaryUserJwt = strapi.plugins['users-permissions'].services.jwt.issue({
      id: primaryUser.id,
    })

    category = await createCategory()
    await createOrganization({
      categories: [category.id],
    })
  })
  it('should guest be able to get organizations', async () => {
    await request(strapi.server.httpServer)
      .get(`/api/organizations`)
      .set('accept', 'application/json')
      .set('Content-Type', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
      .then(({ body: { data } }) => {
        expect(data).toHaveLength(1)
      })
  })

  it('should authentificated user be able to get organizations', async () => {
    await request(strapi.server.httpServer)
      .get(`/api/organizations`)
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
