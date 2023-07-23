const request = require('supertest')
const { JEST_TIMEOUT } = require('./../helpers')
const { setupStrapi, stopStrapi } = require('./../helpers/strapi')

const { createUser } = require('../user/user.factory')
const { createArticle } = require('../article/article.factory')

jest.setTimeout(JEST_TIMEOUT)

beforeAll(async () => {
  await setupStrapi()
})

afterAll(async () => {
  await stopStrapi()
})

describe('Articles', () => {
  let article1

  beforeAll(async () => {
    article1 = await createArticle({ text: 'text' })
    await createArticle({ text: 'text', isPage: true })
  })

  it.each([
    { type: 'public', code: 200 },
    { type: 'authenticated', code: 200 },
    { type: 'manager', code: 200 },
    { type: 'moderator', code: 200 },
  ])(
    'should $type user be able to get all articles, but only not pages',
    async ({ type, code }) => {
      const [, jwt] = await createUser({ type })

      const req = request(strapi.server.httpServer)
        .get(`/api/articles`)
        .set('accept', 'application/json')
        .set('Content-Type', 'application/json')

      if (jwt) {
        req.set('Authorization', `Bearer ${jwt}`)
      }

      await req
        .expect('Content-Type', /json/)
        .expect(code)
        .then(({ body: { data } }) => {
          expect(data).toHaveLength(1)
          expect(data[0].id).toBe(article1.id)
        })
    }
  )

  it.each([
    { type: 'public' },
    { type: 'authenticated' },
    { type: 'manager' },
    { type: 'moderator' },
  ])('should $type user be able to get one article', async ({ type }) => {
    const [, jwt] = await createUser({ type })

    const req = request(strapi.server.httpServer)
      .get(`/api/articles/${article1.id}`)
      .set('accept', 'application/json')
      .set('Content-Type', 'application/json')

    if (jwt) {
      req.set('Authorization', `Bearer ${jwt}`)
    }

    await req
      .expect('Content-Type', /json/)
      .expect(200)
      .then(({ body: { data } }) => {
        expect(data.attributes.text).toBe('text')
      })
  })
})
