const request = require('supertest')
const { JEST_TIMEOUT } = require('./../helpers')
const { setupStrapi, stopStrapi } = require('./../helpers/strapi')

const { createUser } = require('../user/user.factory')
const { createArticle } = require('../article/article.factory')
const { createStaticPages } = require('./static-pages.factory')

jest.setTimeout(JEST_TIMEOUT)

beforeAll(async () => {
  await setupStrapi()
})

afterAll(async () => {
  await stopStrapi()
})

describe('Articles', () => {
  beforeAll(async () => {
    const article1 = await createArticle()
    const article2 = await createArticle({ publishedAt: null })

    await createStaticPages({
      privacy: article1.id,
      help: article2.id,
    })
  })

  it.each([
    { type: 'public' },
    { type: 'authenticated' },
    { type: 'manager' },
    { type: 'moderator' },
  ])('should $type user be able to get static pages', async ({ type }) => {
    const [, jwt] = await createUser({ type })

    const req = request(strapi.server.httpServer)
      .get(`/api/static-pages/privacy`)
      .set('accept', 'application/json')
      .set('Content-Type', 'application/json')

    if (jwt) {
      req.set('Authorization', `Bearer ${jwt}`)
    }

    await req
      .expect('Content-Type', /json/)
      .expect(200)
      .then(({ body: { data } }) => {
        expect(data.attributes.privacy.data.id).toBeDefined()
        expect(data.attributes.privacy.data.attributes).toBeDefined()
        expect(data.attributes.help).toBeUndefined()
      })
  })

  it('should non published page throw an error', async () => {
    await request(strapi.server.httpServer)
      .get(`/api/static-pages/help`)
      .set('accept', 'application/json')
      .set('Content-Type', 'application/json')
      .expect('Content-Type', /json/)
      .expect(400)
  })

  it('should non-existing page throw an error', async () => {
    await request(strapi.server.httpServer)
      .get(`/api/static-pages/privacy1`)
      .set('accept', 'application/json')
      .set('Content-Type', 'application/json')
      .expect('Content-Type', /json/)
      .expect(400)
  })
})
