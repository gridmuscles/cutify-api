const request = require('supertest')
const qs = require('qs')

const { JEST_TIMEOUT } = require('./../helpers')
const { setupStrapi, stopStrapi } = require('./../helpers/strapi')
const fs = require('fs')
const path = require('path')
const FormData = require('form-data')

const { createCategory } = require('../category/category.factory')
const { createOrganization } = require('../organization/organization.factory')
const { createUser } = require('../user/user.factory')
const { createPromotion } = require('../promotion/promotion.factory')
const { createCoupon, getCouponById } = require('../coupon/coupon.factory')
const { createLocation } = require('../location/location.factory')

const listCouponQuery = qs.stringify(
  {
    populate: ['promotion'],
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

describe('Coupons', () => {
  let primaryUser
  let primaryUserJwt
  let primaryManagerJwt
  let category
  let primaryOrganization
  let primaryPromotion

  beforeAll(async () => {
    const [user, userJwt] = await createUser({ type: 'authenticated' })
    primaryUser = user
    primaryUserJwt = userJwt

    const [manager, managerJwt] = await createUser({ type: 'manager' })
    primaryManagerJwt = managerJwt

    category = await createCategory()
    primaryOrganization = await createOrganization({
      categories: [category.id],
    })
    await createLocation({
      managers: [manager.id],
      organization: primaryOrganization.id,
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

    await createCoupon({
      email: 'user1@gmail.com',
      uuid: '3',
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

  it('should guest be able to get any coupons by slug list from the same promotion', async () => {
    await request(strapi.server.httpServer)
      .get(
        `/api/coupons/uuid?filters[uuid][$in][0]=1&filters[uuid][$in][1]=2&${listCouponQuery}`
      )
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

  it('should guest be able to get any coupons by slug list from the same promotion', async () => {
    await request(strapi.server.httpServer)
      .get(
        `/api/coupons/promotion/${primaryPromotion.id}/uuid?filters[uuid][$in][0]=1&filters[uuid][$in][1]=2&${listCouponQuery}`
      )
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
      .get(`/api/coupons/promotion/${primaryPromotion.id}/uuid`)
      .set('accept', 'application/json')
      .set('Content-Type', 'application/json')
      .expect('Content-Type', /json/)
      .expect(400)
  })

  it('should not guest be able to get all coupons', async () => {
    await request(strapi.server.httpServer)
      .get(`/api/coupons`)
      .set('accept', 'application/json')
      .set('Content-Type', 'application/json')
      .expect('Content-Type', /json/)
      .expect(403)
  })

  it('should not guest be able to get coupons by slug list from different promotions', async () => {
    await request(strapi.server.httpServer)
      .get(
        `/api/coupons/promotion/${primaryPromotion.id}/uuid?filters[uuid][$in][0]=1&filters[uuid][$in][1]=2&filters[uuid][$in][2]=3`
      )
      .set('accept', 'application/json')
      .set('Content-Type', 'application/json')
      .expect('Content-Type', /json/)
      .expect(400)
  })

  it('should not guest be able to get coupons by slug list from different promotions', async () => {
    await request(strapi.server.httpServer)
      .get(
        `/api/coupons/uuid?filters[uuid][$in][0]=1&filters[uuid][$in][1]=2&filters[uuid][$in][2]=3`
      )
      .set('accept', 'application/json')
      .set('Content-Type', 'application/json')
      .expect('Content-Type', /json/)
      .expect(400)
  })

  it('should organization manager be able to verify only organization promotion coupon', async () => {
    const coupon = await createCoupon({
      promotion: primaryPromotion.id,
      email: 'user10@gmail.com',
      state: 'active',
    })

    const coupon2 = await createCoupon({
      promotion: primaryPromotion.id,
      email: 'user10@gmail.com',
      state: 'active',
    })

    await request(strapi.server.httpServer)
      .post(`/api/coupons/verify`)
      .set('accept', 'application/json')
      .set('Content-Type', 'application/json')
      .set('Authorization', `Bearer ${primaryManagerJwt}`)
      .send({
        data: {
          uuidList: [coupon.uuid, coupon2.uuid],
        },
      })
      .expect('Content-Type', /json/)
      .expect(200)
  })

  it('should not organization manager be able to verify elses org coupon', async () => {
    const coupon = await createCoupon({
      promotion: primaryPromotion.id,
      email: 'user10@gmail.com',
      state: 'active',
    })

    const coupon2 = await createCoupon({
      email: 'user10@gmail.com',
      state: 'active',
    })

    await request(strapi.server.httpServer)
      .post(`/api/coupons/verify`)
      .set('accept', 'application/json')
      .set('Content-Type', 'application/json')
      .set('Authorization', `Bearer ${primaryManagerJwt}`)
      .send({
        data: {
          uuidList: [coupon.uuid, coupon2.uuid],
        },
      })
      .expect('Content-Type', /json/)
      .expect(400)
  })

  it('should not organization manager be able to verify already verified coupon', async () => {
    const coupon = await createCoupon({
      promotion: primaryPromotion.id,
      email: 'user10@gmail.com',
      state: 'verified',
    })

    await request(strapi.server.httpServer)
      .post(`/api/coupons/verify`)
      .set('accept', 'application/json')
      .set('Content-Type', 'application/json')
      .set('Authorization', `Bearer ${primaryManagerJwt}`)
      .send({
        data: {
          uuidList: [coupon.uuid],
        },
      })
      .expect('Content-Type', /json/)
      .expect(400)
  })

  it.each([
    { type: 'public', code: 401 },
    { type: 'authenticated', code: 403 },
    { type: 'moderator', code: 403 },
  ])(
    'should not $type be able to verify organization promotion coupon',
    async ({ type, code }) => {
      const coupon = await createCoupon({
        promotion: primaryPromotion.id,
        email: 'user10@gmail.com',
      })

      const [, jwt] = await createUser({ type })

      const req = request(strapi.server.httpServer)
        .post(`/api/coupons/verify`)
        .set('accept', 'application/json')
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${jwt}`)
        .send({
          data: {
            uuidList: [coupon.uuid],
          },
        })

      if (jwt) {
        req.set('Authorization', `Bearer ${jwt}`)
      }

      await req.expect('Content-Type', /json/).expect(code)
    }
  )

  it.each([
    { type: 'public', code: 200 },
    { type: 'authenticated', code: 200 },
    { type: 'manager', code: 403 },
    { type: 'moderator', code: 403 },
  ])(
    'should $type user has response $code when verify coupons with confirmation code',
    async ({ type, code }) => {
      const coupon = await createCoupon({
        promotion: primaryPromotion.id,
        email: 'user10@gmail.com',
      })

      const [, jwt] = await createUser({ type })

      const req = request(strapi.server.httpServer)
        .post(`/api/coupons/verify/code`)
        .set('accept', 'application/json')
        .set('Content-Type', 'application/json')
        .send({
          data: {
            code: primaryPromotion.confirmationCode,
            uuidList: [coupon.uuid],
          },
        })

      if (jwt) {
        req.set('Authorization', `Bearer ${jwt}`)
      }

      await req.expect('Content-Type', /json/).expect(code)
    }
  )

  it('should authenticated user be able to verify coupon with confirmation code', async () => {
    const coupon = await createCoupon({
      promotion: primaryPromotion.id,
      email: 'user10@gmail.com',
      state: 'active',
    })

    await request(strapi.server.httpServer)
      .post(`/api/coupons/verify/code`)
      .set('accept', 'application/json')
      .set('Content-Type', 'application/json')
      .set('Authorization', `Bearer ${primaryUserJwt}`)
      .send({
        data: {
          code: primaryPromotion.confirmationCode,
          uuidList: [coupon.uuid],
        },
      })
      .expect('Content-Type', /json/)
      .expect(200)

    const updatedCoupon = await getCouponById({ id: coupon.id })
    expect(updatedCoupon.state).toBe('verified')
  })

  it('should not authenticated user be able to verify coupon with incorrect confirmation code', async () => {
    const coupon = await createCoupon({
      promotion: primaryPromotion.id,
      email: 'user10@gmail.com',
      state: 'active',
    })

    await request(strapi.server.httpServer)
      .post(`/api/coupons/verify/code`)
      .set('accept', 'application/json')
      .set('Content-Type', 'application/json')
      .set('Authorization', `Bearer ${primaryUserJwt}`)
      .send({
        data: {
          code: '11111',
          uuidList: [coupon.uuid],
        },
      })
      .expect('Content-Type', /json/)
      .expect(400)
  })

  it('should not authenticated user be able to verify coupon with if promotion expired', async () => {
    const promotion = await createPromotion({
      categories: [category.id],
      organization: primaryOrganization.id,
      dateTimeUntil: '2023-01-02 23:59:59',
    })

    const coupon = await createCoupon({
      promotion: promotion.id,
      email: 'user10@gmail.com',
      state: 'active',
    })

    await request(strapi.server.httpServer)
      .post(`/api/coupons/verify/code`)
      .set('accept', 'application/json')
      .set('Content-Type', 'application/json')
      .set('Authorization', `Bearer ${primaryUserJwt}`)
      .send({
        data: {
          code: promotion.confirmationCode,
          uuidList: [coupon.uuid],
        },
      })
      .expect('Content-Type', /json/)
      .expect(400)
  })

  it('should anyone be able to verify coupon with receipt', async () => {
    const coupon1 = await createCoupon({
      email: primaryUser.email,
      user: primaryUser.id,
      uuid: 'uuid1',
      promotion: primaryPromotion.id,
    })

    const coupon2 = await createCoupon({
      email: 'user1@gmail.com',
      uuid: 'uuid2',
      promotion: primaryPromotion.id,
    })

    var formData = new FormData()

    formData.append(
      'files.photo',
      fs.createReadStream('tests/coupon/receipt.jpeg')
    )

    await request(strapi.server.httpServer)
      .post(`/api/coupons/verify/receipt`)
      .set('accept', 'application/json')
      .set('Content-type', 'multipart/form-data')
      .field(
        'data',
        JSON.stringify({
          uuidList: [coupon1.uuid, coupon2.uuid],
        })
      )
      .attach(
        'files.photo',
        path.join(__dirname, './receipt.webp'),
        'receipt.webp'
      )
      .expect('Content-Type', /json/)
      .expect(200)

    const updatedCoupon = await getCouponById({ id: coupon1.id })
    expect(updatedCoupon.state).toBe('verified')
    expect(updatedCoupon.receipt).toBeDefined()
  })

  it('should authenticated user be able to get only own coupons', async () => {
    const [user, userJwt] = await createUser({ type: 'authenticated' })

    await createCoupon({
      email: user.email,
      user: user.id,
      uuid: '10',
      promotion: primaryPromotion.id,
    })

    await request(strapi.server.httpServer)
      .get(`/api/coupons/user/me?${listCouponQuery}`)
      .set('accept', 'application/json')
      .set('Content-Type', 'application/json')
      .set('Authorization', `Bearer ${userJwt}`)
      .expect('Content-Type', /json/)
      .expect(200)
      .then(({ body: { data } }) => {
        expect(data).toHaveLength(1)
        expect(data[0].attributes.uuid).toBe('10')
        expect(data[0].attributes.user).toBeUndefined()
        expect(data[0].attributes.promotion.data.attributes.title).toBe(
          primaryPromotion.title
        )
      })
  })
})
