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
  let primaryUserJwt
  let category
  let primaryOrganization
  let primaryPromotion

  beforeAll(async () => {
    primaryUser = await createUser()
    primaryUserJwt = strapi.plugins['users-permissions'].services.jwt.issue({
      id: primaryUser.id,
    })
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

  it('should authentificated user be able to get only own coupons', async () => {
    await request(strapi.server.httpServer)
      .get(`/api/coupons`)
      .set('accept', 'application/json')
      .set('Content-Type', 'application/json')
      .set('Authorization', `Bearer ${primaryUserJwt}`)
      .expect('Content-Type', /json/)
      .expect(200)
      .then(({ body: { data } }) => {
        expect(data).toHaveLength(1)
        expect(data[0].attributes.uuid).toBe('1')
      })
  })

  it('should guest be able to get any coupons by slug list', async () => {
    await request(strapi.server.httpServer)
      .get(`/api/coupons?filters[uuid][$in][0]=1&filters[uuid][$in][1]=2`)
      .set('accept', 'application/json')
      .set('Content-Type', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
      .then(({ body: { data } }) => {
        expect(data).toHaveLength(2)
        expect(data[0].attributes.uuid).toBe('1')
        expect(data[1].attributes.uuid).toBe('2')
      })
  })

  it('should guest be able to get any coupons by slug list', async () => {
    await request(strapi.server.httpServer)
      .get(`/api/coupons`)
      .set('accept', 'application/json')
      .set('Content-Type', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
      .then(({ body: { data } }) => {
        expect(data).toHaveLength(0)
      })
  })
})
