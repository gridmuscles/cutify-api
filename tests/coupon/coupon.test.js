const request = require('supertest')
const { JEST_TIMEOUT } = require('./../helpers')
const { setupStrapi, stopStrapi } = require('./../helpers/strapi')

const { createCategory } = require('../category/category.factory')
const { createOrganization } = require('../organization/organization.factory')
const { createUser } = require('../user/user.factory')
const { createPromotion } = require('../promotion/promotion.factory')
const { createCoupon } = require('../coupon/coupon.factory')

jest.setTimeout(JEST_TIMEOUT)

beforeAll(async () => {
  await setupStrapi()
})

afterAll(async () => {
  await stopStrapi()
})

describe('Coupons', () => {
  let primaryUser
  let category
  let primaryOrganization
  let primaryPromotion

  beforeAll(async () => {
    const [user] = await createUser({ type: 'authenticated' })
    primaryUser = user

    category = await createCategory()
    primaryOrganization = await createOrganization({
      categories: [category.id],
    })
    primaryPromotion = await createPromotion({
      categories: [category.id],
      organization: primaryOrganization.id,
    })

    await createCoupon({
      promotion: primaryPromotion.id,
      email: primaryUser.email,
      user: primaryUser.id,
      uuid: '1',
    })

    await createCoupon({
      promotion: primaryPromotion.id,
      email: 'user1@gmail.com',
      uuid: '2',
    })
  })

  it.each([
    { type: 'public', code: 403 },
    { type: 'authenticated', code: 403 },
    { type: 'manager', code: 403 },
    { type: 'moderator', code: 200 },
  ])(
    'should $type user have a code $code to get all coupons',
    async ({ type, code }) => {
      const [, jwt] = await createUser({ type })

      const req = request(strapi.server.httpServer)
        .get(`/api/coupons`)
        .set('accept', 'application/json')
        .set('Content-Type', 'application/json')

      if (jwt) {
        req.set('Authorization', `Bearer ${jwt}`)
      }

      await req.expect('Content-Type', /json/).expect(code)
    }
  )

  it('should guest be able to get any coupons by slug list', async () => {
    await request(strapi.server.httpServer)
      .get(`/api/coupons/uuid?filters[uuid][$in][0]=1&filters[uuid][$in][1]=2`)
      .set('accept', 'application/json')
      .set('Content-Type', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
      .then(({ body: { data } }) => {
        expect(data).toHaveLength(2)
        expect(data[0].attributes.uuid).toBe('1')
        expect(data[0].attributes.user).toBeUndefined()
        expect(data[0].attributes.promotion.data.attributes.title).toBe(
          primaryPromotion.title
        )
        expect(data[1].attributes.uuid).toBe('2')
        expect(data[1].attributes.promotion.data.attributes.title).toBe(
          primaryPromotion.title
        )
      })
  })

  it('should not guest be able to get any coupons without specific slugs', async () => {
    await request(strapi.server.httpServer)
      .get(`/api/coupons/uuid`)
      .set('accept', 'application/json')
      .set('Content-Type', 'application/json')
      .expect('Content-Type', /json/)
      .expect(400)
  })

  it('should guest not be able to get all coupons', async () => {
    await request(strapi.server.httpServer)
      .get(`/api/coupons`)
      .set('accept', 'application/json')
      .set('Content-Type', 'application/json')
      .expect('Content-Type', /json/)
      .expect(403)
  })
})
