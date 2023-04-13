const request = require('supertest')
const { JEST_TIMEOUT } = require('./../helpers')
const { setupStrapi, stopStrapi } = require('./../helpers/strapi')

const { createCategory } = require('../category/category.factory')
const { createOrganization } = require('../organization/organization.factory')
const { createUser } = require('../user/user.factory')
const { createPromotion } = require('../promotion/promotion.factory')
const { createCoupon, clearCoupons } = require('../coupon/coupon.factory')

jest.setTimeout(JEST_TIMEOUT)

beforeAll(async () => {
  await setupStrapi()
})

afterAll(async () => {
  await stopStrapi()
})

describe('Promotions', () => {
  let primaryUser

  let category
  let primaryOrganization
  let primaryPromotion
  let draftPromotion

  beforeAll(async () => {
    const [user] = await createUser()
    primaryUser = user

    category = await createCategory()
    primaryOrganization = await createOrganization({
      categories: [category.id],
    })
    primaryPromotion = await createPromotion({
      categories: [category.id],
      organization: primaryOrganization.id,
    })
    draftPromotion = await createPromotion({
      categories: [category.id],
      organization: primaryOrganization.id,
      publishedAt: null,
    })
  })

  beforeEach(async () => {
    await clearCoupons()
  })

  it('should guest is able to get all the promotion fields', async () => {
    await request(strapi.server.httpServer)
      .get(`/api/promotions/${primaryPromotion.slug}`)
      .set('accept', 'application/json')
      .set('Content-Type', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
      .then(({ body: { data } }) => {
        expect(data.attributes.categories).toBeDefined()
        expect(data.attributes.organization).toBeDefined()
        expect(
          data.attributes.organization.data.attributes.promotions
        ).toBeDefined()
        expect(
          data.attributes.organization.data.attributes.locations
        ).toBeDefined()
        expect(
          data.attributes.organization.data.attributes.promotions.data[0]
            .attributes.organization
        ).toBeUndefined()
      })
  })

  it('should guest is able to request up to 10 coupons', async () => {
    const emailSendMock = (strapi.plugin('email').service('email').send = jest
      .fn()
      .mockReturnValue(true))

    await request(strapi.server.httpServer)
      .post(`/api/promotions/${primaryPromotion.id}/request`)
      .set('accept', 'application/json')
      .set('Content-Type', 'application/json')
      .send({
        email: primaryUser.email,
        count: 10,
      })
      .expect('Content-Type', /json/)
      .expect(200)
      .then(({ body: { data } }) => {
        expect(data).toHaveLength(10)
      })

    expect(emailSendMock).toBeCalledTimes(1)

    const {
      to,
      dynamicTemplateData: { link },
    } = emailSendMock.mock.calls[0][0]
    expect(to).toBe(primaryUser.email)
    expect(link.split('[uuid][$in]')).toHaveLength(11)
  })

  it('should be an error if guest exceed the total limit of coupons', async () => {
    await createCoupon({
      promotion: primaryPromotion.id,
      email: 'user1@gmail.com',
    })

    await request(strapi.server.httpServer)
      .post(`/api/promotions/${primaryPromotion.id}/request`)
      .set('accept', 'application/json')
      .set('Content-Type', 'application/json')
      .send({
        email: 'user1@gmail.com',
        count: 10,
      })
      .expect('Content-Type', /json/)
      .expect(400)
  })

  it('should be an error if coupon requested for a draft promotion', async () => {
    await request(strapi.server.httpServer)
      .post(`/api/promotions/${draftPromotion.id}/request`)
      .set('accept', 'application/json')
      .set('Content-Type', 'application/json')
      .send({
        email: 'user1@gmail.com',
        count: 10,
      })
      .expect('Content-Type', /json/)
      .expect(400)
  })

  it('should guest is able to request promotion by slug with updated views number', async () => {
    const slug = 'promotion-1-slug'
    await createPromotion({
      categories: [category.id],
      organization: primaryOrganization.id,
      slug,
    })

    await request(strapi.server.httpServer)
      .get(`/api/promotions/${slug}?views=true`)
      .set('accept', 'application/json')
      .set('Content-Type', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)

    await request(strapi.server.httpServer)
      .get(`/api/promotions/${slug}`)
      .set('accept', 'application/json')
      .set('Content-Type', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
      .then(({ body: { data } }) => {
        expect(data).toBeDefined()
        expect(data.attributes.viewsCount).toBe(1)
      })
  })

  it('should guest is able to request promotion by slug with the original views number', async () => {
    const slug = 'promotion-2-slug'
    await createPromotion({
      categories: [category.id],
      organization: primaryOrganization.id,
      slug,
    })

    await request(strapi.server.httpServer)
      .get(`/api/promotions/${slug}`)
      .set('accept', 'application/json')
      .set('Content-Type', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)

    await request(strapi.server.httpServer)
      .get(`/api/promotions/${slug}`)
      .set('accept', 'application/json')
      .set('Content-Type', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
      .then(({ body: { data } }) => {
        expect(data).toBeDefined()
        expect(data.attributes.viewsCount).toBe(0)
      })
  })

  it('should guest is able to request promotion and see coupons number', async () => {
    await createCoupon({ promotion: primaryPromotion.id })

    await request(strapi.server.httpServer)
      .get(`/api/promotions/${primaryPromotion.slug}`)
      .set('accept', 'application/json')
      .set('Content-Type', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
      .then(({ body: { data } }) => {
        expect(data).toBeDefined()
        expect(data.attributes.couponsCount).toBe(1)
      })
  })

  it('should guest is able to see a single draft promotion', async () => {
    await request(strapi.server.httpServer)
      .get(`/api/promotions/${draftPromotion.id}`)
      .set('accept', 'application/json')
      .set('Content-Type', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
      .then(({ body: { data } }) => {
        expect(data).toBeDefined()
      })
  })

  it('should guest not be able to request a coupon for the draft promotion', async () => {
    await request(strapi.server.httpServer)
      .post(`/api/promotions/${draftPromotion.id}/request`)
      .set('accept', 'application/json')
      .set('Content-Type', 'application/json')
      .send({
        email: primaryUser.email,
        count: 1,
      })
      .expect('Content-Type', /json/)
      .expect(400)
  })
})
