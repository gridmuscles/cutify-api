const request = require('supertest')
const { JEST_TIMEOUT } = require('./../helpers')
const { setupStrapi, stopStrapi } = require('./../helpers/strapi')

const { createCategory } = require('../category/category.factory')
const { createOrganization } = require('../organization/organization.factory')
const { createUser } = require('../user/user.factory')
const { createPromotion } = require('../promotion/promotion.factory')
const { createCoupon, clearCoupons } = require('../coupon/coupon.factory')
const { createAuction } = require('../auction/auction.factory')

jest.setTimeout(JEST_TIMEOUT)

beforeAll(async () => {
  await setupStrapi()
})

afterAll(async () => {
  await stopStrapi()
})

describe('Promotions', () => {
  let authenticatedUser
  let authenticatedUserJwt
  let managerUserJwt

  let category
  let primaryOrganization
  let primaryPromotion
  let draftPromotion
  let primaryAuction
  let auctionPromotion

  beforeAll(async () => {
    const [user, jwt] = await createUser({ type: 'authenticated' })
    authenticatedUser = user
    authenticatedUserJwt = jwt

    const [, jwt2] = await createUser({ type: 'manager' })
    managerUserJwt = jwt2

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

    primaryAuction = await createAuction()

    auctionPromotion = await createPromotion({
      categories: [category.id],
      organization: primaryOrganization.id,
      auction: primaryAuction.id,
    })
  })

  beforeEach(async () => {
    await clearCoupons()
  })

  it('should guest be able to get the populated published promotion by slug', async () => {
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

  it('should guest be able to request up to 10 coupons', async () => {
    const emailSendMock = (strapi.plugin('email').service('email').send = jest
      .fn()
      .mockReturnValue(true))

    await request(strapi.server.httpServer)
      .post(`/api/promotions/${primaryPromotion.id}/request`)
      .set('accept', 'application/json')
      .set('Content-Type', 'application/json')
      .send({
        email: authenticatedUser.email,
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
    expect(to).toBe(authenticatedUser.email)
    expect(link.split('[uuid][$in]')).toHaveLength(11)
  })

  it('should be an error if user exceed the total user limit of coupons', async () => {
    const emailSendMock = (strapi.plugin('email').service('email').send = jest
      .fn()
      .mockReturnValue(true))

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

    expect(emailSendMock).toBeCalledTimes(0)
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

  it('should be an error if coupon requested for an auction promotion', async () => {
    await request(strapi.server.httpServer)
      .post(`/api/promotions/${auctionPromotion.id}/request`)
      .set('accept', 'application/json')
      .set('Content-Type', 'application/json')
      .send({
        email: 'user1@gmail.com',
        count: 1,
      })
      .expect('Content-Type', /json/)
      .expect(400)
  })

  it('should guest be able to request promotion by slug with updated views number', async () => {
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

  it('should guest be able to request promotion by slug with the original views number', async () => {
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

  it('should guest be able to request promotion and see coupons number', async () => {
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

  it('should guest be able to request promotion list and see coupons number of each promotion', async () => {
    const promotion = await createPromotion({
      categories: [category.id],
      organization: primaryOrganization.id,
    })

    await createCoupon({ promotion: promotion.id })
    await createCoupon({ promotion: promotion.id })

    await request(strapi.server.httpServer)
      .get(`/api/promotions`)
      .set('accept', 'application/json')
      .set('Content-Type', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
      .then(({ body: { data } }) => {
        expect(data[data.length - 1]).toBeDefined()
        expect(data[data.length - 1].attributes.couponsCount).toBe(2)
      })
  })

  it('should guest be able to see a single populated draft promotion', async () => {
    await request(strapi.server.httpServer)
      .get(`/api/promotions/${draftPromotion.id}`)
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

  it('should guest not be able to request a coupon for the draft promotion', async () => {
    await request(strapi.server.httpServer)
      .post(`/api/promotions/${draftPromotion.id}/request`)
      .set('accept', 'application/json')
      .set('Content-Type', 'application/json')
      .send({
        email: authenticatedUser.email,
        count: 1,
      })
      .expect('Content-Type', /json/)
      .expect(400)
  })

  it('should authenticated user be able to complete the auction and get coupon', async () => {
    const emailSendMock = (strapi.plugin('email').service('email').send = jest
      .fn()
      .mockReturnValue({ id: 1 }))

    await request(strapi.server.httpServer)
      .post(`/api/promotions/${auctionPromotion.id}/auction/complete`)
      .set('accept', 'application/json')
      .set('Content-Type', 'application/json')
      .set('Authorization', `Bearer ${authenticatedUserJwt}`)
      .expect('Content-Type', /json/)
      .expect(200)

    expect(emailSendMock).toBeCalledTimes(1)

    await request(strapi.server.httpServer)
      .get(`/api/promotions/${auctionPromotion.id}`)
      .set('accept', 'application/json')
      .set('Content-Type', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
      .then(({ body: { data } }) => {
        expect(data.attributes.auction.data.attributes.status).toBe('completed')
      })
  })

  it('should not authenticated user be able to complete the already completed auction', async () => {
    const auction = await createAuction({
      status: 'completed',
    })

    const promotion = await createPromotion({
      categories: [category.id],
      organization: primaryOrganization.id,
      auction: auction.id,
    })

    const emailSendMock = (strapi.plugin('email').service('email').send = jest
      .fn()
      .mockReturnValue({ id: 1 }))

    await request(strapi.server.httpServer)
      .post(`/api/promotions/${promotion.id}/auction/complete`)
      .set('accept', 'application/json')
      .set('Content-Type', 'application/json')
      .set('Authorization', `Bearer ${authenticatedUserJwt}`)
      .expect('Content-Type', /json/)
      .expect(400)

    expect(emailSendMock).toBeCalledTimes(0)
  })

  it('should not public user be able to complete the auction and get coupon', async () => {
    await request(strapi.server.httpServer)
      .post(`/api/promotions/${auctionPromotion.id}/auction/complete`)
      .set('accept', 'application/json')
      .set('Content-Type', 'application/json')
      .expect('Content-Type', /json/)
      .expect(403)
  })

  it('should not manager user be able to complete the auction and get coupon', async () => {
    await request(strapi.server.httpServer)
      .post(`/api/promotions/${auctionPromotion.id}/auction/complete`)
      .set('accept', 'application/json')
      .set('Content-Type', 'application/json')
      .set('Authorization', `Bearer ${managerUserJwt}`)
      .expect('Content-Type', /json/)
      .expect(403)
  })
})
