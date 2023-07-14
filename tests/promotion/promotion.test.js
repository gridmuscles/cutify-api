const request = require('supertest')
const qs = require('qs')

const { JEST_TIMEOUT } = require('./../helpers')
const { setupStrapi, stopStrapi } = require('./../helpers/strapi')

const { createCategory } = require('../category/category.factory')
const { createOrganization } = require('../organization/organization.factory')
const { createUser } = require('../user/user.factory')
const {
  createPromotion,
  getPromotionById,
} = require('../promotion/promotion.factory')
const {
  createCoupon,
  clearCoupons,
  getCouponByUuid,
} = require('../coupon/coupon.factory')
const { createAuction } = require('../auction/auction.factory')
const { createLocation } = require('../location/location.factory')

const listPromotionQuery = qs.stringify(
  {
    populate: ['auction', 'categories', 'images', 'organization'],
  },
  {
    encodeValuesOnly: true,
  }
)

const singlePromotionQuery = qs.stringify(
  {
    populate: [
      'auction',
      'categories',
      'images',
      'organization',
      'locations',
      'seo',
      'seo.metaSocial',
    ],
  },

  {
    encodeValuesOnly: true,
  }
)

jest.setTimeout(JEST_TIMEOUT)

beforeAll(async () => {
  await setupStrapi()
})

afterAll(async () => {
  await stopStrapi()
})

describe('Promotions', () => {
  let authenticatedUser
  let managerUserJwt

  let primaryCategory
  let primaryOrganization
  let primaryLocation
  let primaryPromotion
  let draftPromotion
  let primaryAuction
  let auctionPromotion

  beforeAll(async () => {
    const [user] = await createUser({ type: 'authenticated' })
    authenticatedUser = user

    const [manager, jwt2] = await createUser({ type: 'manager' })
    managerUserJwt = jwt2

    primaryCategory = await createCategory()
    const category2 = await createCategory()

    primaryOrganization = await createOrganization({
      categories: [primaryCategory.id],
    })
    primaryLocation = await createLocation({
      organization: primaryOrganization.id,
      managers: [manager.id],
    })
    primaryPromotion = await createPromotion({
      categories: [primaryCategory.id],
      organization: primaryOrganization.id,
      seo: { keywords: 'a,b,c' },
      title: 'Company tytuł EN',
      title_pl: 'Tytuł firmy PL',
      title_ru: 'Tytuł компании RU',
      title_ua: 'Tytuł компанії UA',
      promoCode: 'promo-code',
    })
    await createPromotion({
      categories: [category2.id],
      organization: primaryOrganization.id,
      title: 'Company tytuł 2 EN',
      title_pl: 'Tytuł firmy 2 PL',
      title_ru: 'Tytuł компании 2 RU',
      title_ua: 'Tytuł компанії 2 UA',
    })
    draftPromotion = await createPromotion({
      categories: [primaryCategory.id],
      organization: primaryOrganization.id,
      publishedAt: null,
    })

    primaryAuction = await createAuction()

    auctionPromotion = await createPromotion({
      categories: [primaryCategory.id],
      organization: primaryOrganization.id,
      auction: primaryAuction.id,
    })
  })

  beforeEach(async () => {
    await clearCoupons()
  })

  it('should guest be able to get the populated published promotion by slug', async () => {
    await request(strapi.server.httpServer)
      .get(
        `/api/promotions/slug/${primaryPromotion.slug}?${singlePromotionQuery}`
      )
      .set('accept', 'application/json')
      .set('Content-Type', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
      .then(({ body: { data } }) => {
        expect(data.attributes.categories).toBeDefined()
        expect(data.attributes.organization).toBeDefined()
        expect(
          data.attributes.organization.data.attributes.promotions
        ).toBeUndefined()
        expect(data.attributes.locations.data[0].attributes.address).toBe(
          primaryLocation.address
        )
        expect(
          data.attributes.locations.data[0].attributes.phone
        ).toBeUndefined()
        expect(data.attributes.locations.data[0].attributes.pin).toBe(
          primaryLocation.pin
        )
        expect(data.attributes.locations.data[0].attributes.forwardPhone).toBe(
          primaryLocation.forwardPhone
        )
        expect(data.attributes.locations.data[0].attributes.publicPhone).toBe(
          primaryLocation.publicPhone
        )
        expect(
          data.attributes.organization.data.attributes.promotions
        ).toBeUndefined()
        expect(data.attributes.seo.keywords).toBe('a,b,c')
        expect(data.attributes.seo.metaSocial).toBeDefined()
        expect(data.attributes.couponDescription).toBeUndefined()
      })
  })

  it('should guest be able to request up to 10 coupons', async () => {
    const promotion = await createPromotion({
      categories: [primaryCategory.id],
      organization: primaryOrganization.id,
    })

    const emailSendMock = (strapi.plugin('email').service('email').send = jest
      .fn()
      .mockReturnValue(true))

    const couponData = await request(strapi.server.httpServer)
      .post(`/api/promotions/${promotion.id}/request`)
      .set('accept', 'application/json')
      .set('Content-Type', 'application/json')
      .send({
        email: authenticatedUser.email,
        count: 1,
      })
      .expect('Content-Type', /json/)
      .expect(200)
      .then(({ body: { data } }) => data)

    expect(emailSendMock).toBeCalledTimes(1)

    const coupon = await getCouponByUuid({ uuid: couponData[0] })
    expect(coupon.promotion.id).toBe(promotion.id)

    const {
      to,
      dynamicTemplateData: { link },
    } = emailSendMock.mock.calls[0][0]
    expect(to).toBe(authenticatedUser.email)
    expect(link.split('[uuid][$in]')).toHaveLength(2)
    expect(link.includes('[promotion][id]')).toBe(true)

    const updatedPromotion1 = await getPromotionById({ id: promotion.id })
    expect(updatedPromotion1.couponsCount).toBe(1)

    await request(strapi.server.httpServer)
      .post(`/api/promotions/${promotion.id}/request`)
      .set('accept', 'application/json')
      .set('Content-Type', 'application/json')
      .send({
        email: authenticatedUser.email,
        count: 9,
      })
      .expect('Content-Type', /json/)
      .expect(200)
      .then(({ body: { data } }) => {
        expect(data).toHaveLength(9)
      })

    const updatedPromotion2 = await getPromotionById({ id: promotion.id })
    expect(updatedPromotion2.couponsCount).toBe(10)
  })

  it('should be an error if user exceed the total user limit of coupons even with the different case of email', async () => {
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
        email: 'USER1@gmail.com',
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
      categories: [primaryCategory.id],
      organization: primaryOrganization.id,
      slug,
    })

    await request(strapi.server.httpServer)
      .get(`/api/promotions/slug/${slug}?views=true`)
      .set('accept', 'application/json')
      .set('Content-Type', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)

    await request(strapi.server.httpServer)
      .get(`/api/promotions/slug/${slug}`)
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
      categories: [primaryCategory.id],
      organization: primaryOrganization.id,
      slug,
    })

    await request(strapi.server.httpServer)
      .get(`/api/promotions/slug/${slug}`)
      .set('accept', 'application/json')
      .set('Content-Type', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)

    await request(strapi.server.httpServer)
      .get(`/api/promotions/slug/${slug}`)
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
    const promotion = await createPromotion({
      categories: [primaryCategory.id],
      organization: primaryOrganization.id,
    })

    await createCoupon({ promotion: promotion.id })

    await request(strapi.server.httpServer)
      .get(`/api/promotions/slug/${promotion.slug}`)
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
      categories: [primaryCategory.id],
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

  it.each([
    {
      locale: 'en',
      search: 'tytuł',
      result: 1,
      filters: `&filters[categories][id][$eq]=2`,
    },
    { locale: 'ru', search: 'tytuł', result: 2, filters: '' },
    {
      locale: 'ua',
      search: 'tytuł',
      result: 1,
      filters: `&filters[categories][id][$eq]=2`,
    },
    { locale: 'pl', search: 'tytuł', result: 2, filters: '' },
    { locale: 'en', search: 'UA', result: 0, filters: '' },
    { locale: 'ru', search: 'UA', result: 0, filters: '' },
    { locale: 'ua', search: 'UA', result: 2, filters: '' },
    { locale: 'pl', search: 'UA', result: 0, filters: '' },
  ])(
    'should search title $company in $locale locale returns $result with filters: $filters',
    async ({ locale, search, result, filters }) => {
      await request(strapi.server.httpServer)
        .get(
          encodeURI(
            `/api/promotions?search=${search}&locale=${locale}${filters}`
          )
        )
        .set('accept', 'application/json')
        .set('Content-Type', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .then(({ body: { data } }) => {
          expect(data).toHaveLength(result)
        })
    }
  )

  it('should guest be able to see a single populated draft promotion', async () => {
    await request(strapi.server.httpServer)
      .get(`/api/promotions/${draftPromotion.id}?${singlePromotionQuery}`)
      .set('accept', 'application/json')
      .set('Content-Type', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
      .then(({ body: { data } }) => {
        expect(data.attributes.categories).toBeDefined()
        expect(data.attributes.organization).toBeDefined()
        expect(data.attributes.locations).toBeDefined()
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

  it('should manager user be able to get promotions from organization only', async () => {
    const [manager1, jwt2] = await createUser({ type: 'manager' })

    const organization = await createOrganization({
      categories: [primaryCategory.id],
    })
    await createLocation({
      organization: organization.id,
      managers: [manager1.id],
    })

    const promotion = await createPromotion({
      categories: [primaryCategory.id],
      organization: organization.id,
    })

    await createPromotion({
      categories: [primaryCategory.id],
    })

    await request(strapi.server.httpServer)
      .get(`/api/promotions/manager?${listPromotionQuery}`)
      .set('accept', 'application/json')
      .set('Content-Type', 'application/json')
      .set('Authorization', `Bearer ${jwt2}`)
      .expect('Content-Type', /json/)
      .then(({ body: { data } }) => {
        expect(data).toHaveLength(1)
        expect(data[0].id).toBe(promotion.id)
      })
  })

  it('should manager user be able to get promotion confirmation code', async () => {
    await request(strapi.server.httpServer)
      .get(`/api/promotions/${primaryPromotion.id}/confirmation-code`)
      .set('accept', 'application/json')
      .set('Content-Type', 'application/json')
      .set('Authorization', `Bearer ${managerUserJwt}`)
      .expect('Content-Type', /json/)
      .then(({ body: { data } }) => {
        expect(data.confirmationCode).toBe(primaryPromotion.confirmationCode)
      })
  })

  it('should not manager user be able to get promotion confirmation code if another organization', async () => {
    const [, jwt2] = await createUser({ type: 'manager' })

    await request(strapi.server.httpServer)
      .get(`/api/promotions/${primaryPromotion.id}/confirmation-code`)
      .set('accept', 'application/json')
      .set('Content-Type', 'application/json')
      .set('Authorization', `Bearer ${jwt2}`)
      .expect('Content-Type', /json/)
      .expect(400)
  })

  it.each([
    { type: 'public', code: 401 },
    { type: 'authenticated', code: 403 },
    { type: 'moderator', code: 403 },
  ])(
    'should not $type be able to get promotion confirmation code',
    async ({ type, code }) => {
      const [, jwt] = await createUser({ type })

      const req = request(strapi.server.httpServer)
        .get(`/api/promotions/${primaryPromotion.id}/confirmation-code`)
        .set('accept', 'application/json')
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${jwt}`)

      if (jwt) {
        req.set('Authorization', `Bearer ${jwt}`)
      }

      await req.expect('Content-Type', /json/).expect(code)
    }
  )

  it.each([
    { type: 'public', code: 200 },
    { type: 'authenticated', code: 200 },
    { type: 'manager', code: 200 },
    { type: 'moderator', code: 200 },
  ])(
    'should $type be able to get promotion recommendations',
    async ({ type, code }) => {
      const [, jwt] = await createUser({ type })

      const req = request(strapi.server.httpServer)
        .get(`/api/promotions/${primaryPromotion.id}/recommendations`)
        .set('accept', 'application/json')
        .set('Content-Type', 'application/json')

      if (jwt) {
        req.set('Authorization', `Bearer ${jwt}`)
      }

      await req.expect('Content-Type', /json/).expect(code)
    }
  )

  it('should guest be able to get the promotions recommendations', async () => {
    await request(strapi.server.httpServer)
      .get(
        `/api/promotions/${primaryPromotion.id}/recommendations?${listPromotionQuery}`
      )
      .set('accept', 'application/json')
      .set('Content-Type', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
      .then(({ body: { data } }) => {
        expect(data.length > 0).toBe(true)
        expect(data.some((p) => p.id === primaryPromotion.id)).toBe(false)
        expect(data[0].attributes.organization.data).toBeDefined()
      })
  })

  it.each([
    { type: 'public', code: 200 },
    { type: 'authenticated', code: 200 },
    { type: 'manager', code: 200 },
    { type: 'moderator', code: 200 },
  ])(
    'should $type be able to get promotion similar',
    async ({ type, code }) => {
      const [, jwt] = await createUser({ type })

      const req = request(strapi.server.httpServer)
        .get(`/api/promotions/${primaryPromotion.id}/similar`)
        .set('accept', 'application/json')
        .set('Content-Type', 'application/json')

      if (jwt) {
        req.set('Authorization', `Bearer ${jwt}`)
      }

      await req.expect('Content-Type', /json/).expect(code)
    }
  )

  it('should guest be able to get the promotions similar', async () => {
    await request(strapi.server.httpServer)
      .get(
        `/api/promotions/${primaryPromotion.id}/similar?${listPromotionQuery}`
      )
      .set('accept', 'application/json')
      .set('Content-Type', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
      .then(({ body: { data } }) => {
        expect(data.length > 0).toBe(true)
        expect(data.some((p) => p.id === primaryPromotion.id)).toBe(false)
        expect(data[0].attributes.organization.data).toBeDefined()
      })
  })
})
