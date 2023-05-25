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
    const article2 = await createArticle()
    const article3 = await createArticle()
    const article4 = await createArticle()
    const article5 = await createArticle()
    const article6 = await createArticle()

    await createStaticPages({
      privacy: article1.id,
      about: article2.id,
      help: article3.id,
      support: article4.id,
      contacts: article5.id,
      howitworks: article6.id,
    })
  })

  it.each([
    { type: 'public' },
    { type: 'authenticated' },
    { type: 'manager' },
    { type: 'moderator' },
  ])('should $type user be able to get static pages list', async ({ type }) => {
    const [, jwt] = await createUser({ type })

    const req = request(strapi.server.httpServer)
      .get(`/api/static-pages`)
      .set('accept', 'application/json')
      .set('Content-Type', 'application/json')

    if (jwt) {
      req.set('Authorization', `Bearer ${jwt}`)
    }

    await req
      .expect('Content-Type', /json/)
      .expect(200)
      .then(({ body: { data } }) => {
        expect(data.attributes.privacy.id).toBeDefined()
        expect(data.attributes.privacy.attributes).toBeUndefined()

        expect(data.attributes.about.id).toBeDefined()
        expect(data.attributes.help.id).toBeDefined()
        expect(data.attributes.support.id).toBeDefined()
        expect(data.attributes.contacts.id).toBeDefined()
        expect(data.attributes.howitworks.id).toBeDefined()
      })
  })
})
