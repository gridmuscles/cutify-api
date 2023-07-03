const request = require('supertest')
const qs = require('qs')

const { JEST_TIMEOUT } = require('./../helpers')
const { setupStrapi, stopStrapi } = require('./../helpers/strapi')

const { createUser } = require('../user/user.factory')
const { createAuction } = require('./auction.factory')
const { createPromotion } = require('../promotion/promotion.factory')
const { createCategory } = require('../category/category.factory')
const { createOrganization } = require('../organization/organization.factory')
const { createBid } = require('../bid/bid.factory')

const singlePromotionQuery = qs.stringify(
  {
    populate: ['auction'],
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

describe('Auction', () => {
  let authenticatedUser
  let authenticatedUserJwt
  let managerUserJwt

  let primaryCategory
  let primaryOrganization
  let primaryPromotion
  let primaryAuction

  beforeAll(async () => {
    const [user, jwt] = await createUser({ type: 'authenticated' })
    authenticatedUser = user
    authenticatedUserJwt = jwt

    const [, jwt2] = await createUser({ type: 'manager' })
    managerUserJwt = jwt2

    primaryCategory = await createCategory()
    primaryOrganization = await createOrganization({
      categories: [primaryCategory.id],
    })
    primaryPromotion = await createPromotion({
      categories: [primaryCategory.id],
      organization: primaryOrganization.id,
      seo: { keywords: 'a,b,c' },
      title: 'Company tytuł EN',
      title_pl: 'Tytuł firmy PL',
      title_ru: 'Tytuł компании RU',
      title_ua: 'Tytuł компанії UA',
    })
    primaryAuction = await createAuction({
      promotion: primaryPromotion.id,
    })
  })

  it.each([
    { type: 'public', expectedLength: 1 },
    { type: 'authenticated', expectedLength: 1 },
    { type: 'manager', expectedLength: 1 },
    { type: 'moderator', expectedLength: 1 },
  ])(
    'should $type user is able to get auctions',
    async ({ type, expectedLength }) => {
      const [, jwt] = await createUser({ type })

      const req = request(strapi.server.httpServer)
        .get(`/api/auctions`)
        .set('accept', 'application/json')
        .set('Content-Type', 'application/json')

      if (jwt) {
        req.set('Authorization', `Bearer ${jwt}`)
      }

      await req
        .expect('Content-Type', /json/)
        .expect(200)
        .then(({ body: { data } }) => {
          expect(data).toHaveLength(expectedLength)
        })
    }
  )

  it.each([
    { type: 'public', code: 401 },
    { type: 'authenticated', code: 403 },
    { type: 'manager', code: 403 },
  ])('should not $type be able to verify auction', async ({ type, code }) => {
    const [, jwt] = await createUser({ type })

    const auction = await createAuction({
      status: 'completed',
    })

    await createPromotion({
      categories: [primaryCategory.id],
      organization: primaryOrganization.id,
      auction: auction.id,
    })

    const req = request(strapi.server.httpServer)
      .post(`/api/auctions/${auction.id}/verify`)
      .set('accept', 'application/json')
      .set('Content-Type', 'application/json')
      .set('Authorization', `Bearer ${jwt}`)

    if (jwt) {
      req.set('Authorization', `Bearer ${jwt}`)
    }

    await req.expect('Content-Type', /json/).expect(code)
  })

  it('should moderator user be able to verify the auction', async () => {
    const [, jwt] = await createUser({ type: 'moderator' })

    const auction = await createAuction({
      status: 'completed',
    })

    await createBid({
      bidder: authenticatedUser.id,
      auction: auction.id,
      amount: 90,
    })

    const promotion = await createPromotion({
      categories: [primaryCategory.id],
      organization: primaryOrganization.id,
      auction: auction.id,
    })

    const emailSendMock = (strapi.plugin('email').service('email').send = jest
      .fn()
      .mockReturnValue({ id: 1 }))

    await request(strapi.server.httpServer)
      .post(`/api/auctions/${auction.id}/verify`)
      .set('accept', 'application/json')
      .set('Content-Type', 'application/json')
      .set('Authorization', `Bearer ${jwt}`)
      .expect('Content-Type', /json/)
      .expect(200)

    expect(emailSendMock).toBeCalledTimes(1)

    await request(strapi.server.httpServer)
      .get(`/api/promotions/${promotion.id}?${singlePromotionQuery}`)
      .set('accept', 'application/json')
      .set('Content-Type', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
      .then(({ body: { data } }) => {
        expect(data.attributes.auction.data.attributes.status).toBe('verified')
      })
  })

  it('should authenticated user be able to complete the auction', async () => {
    const emailSendMock = (strapi.plugin('email').service('email').send = jest
      .fn()
      .mockReturnValue({ id: 1 }))

    await request(strapi.server.httpServer)
      .post(`/api/auctions/${primaryAuction.id}/complete`)
      .set('accept', 'application/json')
      .set('Content-Type', 'application/json')
      .set('Authorization', `Bearer ${authenticatedUserJwt}`)
      .expect('Content-Type', /json/)
      .expect(200)

    expect(emailSendMock).toBeCalledTimes(0)

    await request(strapi.server.httpServer)
      .get(`/api/promotions/${primaryAuction.id}?${singlePromotionQuery}`)
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

    await createPromotion({
      categories: [primaryCategory.id],
      organization: primaryOrganization.id,
      auction: auction.id,
    })

    const emailSendMock = (strapi.plugin('email').service('email').send = jest
      .fn()
      .mockReturnValue({ id: 1 }))

    await request(strapi.server.httpServer)
      .post(`/api/auctions/${auction.id}/complete`)
      .set('accept', 'application/json')
      .set('Content-Type', 'application/json')
      .set('Authorization', `Bearer ${authenticatedUserJwt}`)
      .expect('Content-Type', /json/)
      .expect(400)

    expect(emailSendMock).toBeCalledTimes(0)
  })

  it('should not authenticated user be able to complete the verified auction', async () => {
    const auction = await createAuction({
      status: 'verified',
    })

    await createPromotion({
      categories: [primaryCategory.id],
      organization: primaryOrganization.id,
      auction: auction.id,
    })

    const emailSendMock = (strapi.plugin('email').service('email').send = jest
      .fn()
      .mockReturnValue({ id: 1 }))

    await request(strapi.server.httpServer)
      .post(`/api/auctions/${auction.id}/complete`)
      .set('accept', 'application/json')
      .set('Content-Type', 'application/json')
      .set('Authorization', `Bearer ${authenticatedUserJwt}`)
      .expect('Content-Type', /json/)
      .expect(400)

    expect(emailSendMock).toBeCalledTimes(0)
  })

  it('should not public user be able to complete the auction and get coupon', async () => {
    await request(strapi.server.httpServer)
      .post(`/api/auctions/${primaryAuction.id}/complete`)
      .set('accept', 'application/json')
      .set('Content-Type', 'application/json')
      .expect('Content-Type', /json/)
      .expect(403)
  })

  it('should not manager user be able to complete the auction and get coupon', async () => {
    await request(strapi.server.httpServer)
      .post(`/api/auctions/${primaryAuction.id}/complete`)
      .set('accept', 'application/json')
      .set('Content-Type', 'application/json')
      .set('Authorization', `Bearer ${managerUserJwt}`)
      .expect('Content-Type', /json/)
      .expect(403)
  })
})
