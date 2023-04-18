const request = require('supertest')
const { JEST_TIMEOUT } = require('./../helpers')
const { setupStrapi, stopStrapi } = require('./../helpers/strapi')

const { createCategory } = require('../category/category.factory')
const { createOrganization } = require('../organization/organization.factory')
const { createPromotion } = require('../promotion/promotion.factory')
const { createAuction } = require('./auction.factory')
const { createBid, clearBids } = require('../bid/bid.factory')
const { createUser } = require('../user/user.factory')

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

  let category
  let primaryOrganization
  let primaryPromotion
  let primaryAuction

  beforeAll(async () => {
    const [user1, jwt1] = await createUser({ type: 'authenticated' })
    authenticatedUser = user1
    authenticatedUserJwt = jwt1

    const [, jwt2] = await createUser({ type: 'manager' })
    managerUserJwt = jwt2

    category = await createCategory()
    primaryOrganization = await createOrganization({
      categories: [category.id],
    })
    primaryPromotion = await createPromotion({
      categories: [category.id],
      organization: primaryOrganization.id,
      couponsLimit: 0,
    })

    primaryAuction = await createAuction({ promotion: primaryPromotion.id })
  })

  beforeEach(async () => {
    await createBid({
      bidder: authenticatedUser.id,
      auction: primaryAuction.id,
      amount: 100,
    })
  })

  afterEach(async () => {
    await clearBids()
  })

  it.each([
    { type: 'public', expectedLength: 1 },
    { type: 'authenticated', expectedLength: 1 },
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

  it.each([{ type: 'public' }, { type: 'authenticated' }])(
    'should $type user is able to get a latest auction bid',
    async ({ type }) => {
      const latestBid = await createBid({
        bidder: authenticatedUser.id,
        auction: primaryAuction.id,
        amount: 90,
      })
      const [, jwt] = await createUser({ type })

      const req = request(strapi.server.httpServer)
        .get(`/api/auctions/${primaryAuction.id}/bids/latest`)
        .set('accept', 'application/json')
        .set('Content-Type', 'application/json')

      if (jwt) {
        req.set('Authorization', `Bearer ${jwt}`)
      }

      await req
        .expect('Content-Type', /json/)
        .expect(200)
        .then(({ body: { data } }) => {
          expect(data.id).toBe(latestBid.id)
        })
    }
  )

  it('should authenticated user is able to do a bid', async () => {
    await request(strapi.server.httpServer)
      .post(`/api/auctions/${primaryAuction.id}/bids`)
      .set('accept', 'application/json')
      .set('Content-Type', 'application/json')
      .set('Authorization', `Bearer ${authenticatedUserJwt}`)
      .send({
        data: {
          amount: 90,
        },
      })
      .expect('Content-Type', /json/)
      .expect(200)
      .then(({ body: { data } }) => {
        expect(data).toBeDefined()
      })
  })

  it('should not authenticated user be able to do a bid less than the max bid for asc auction', async () => {
    const auction = await createAuction({
      promotion: primaryPromotion.id,
      direction: 'asc',
    })

    await createBid({
      bidder: authenticatedUser.id,
      auction: auction.id,
      amount: 100,
    })

    await request(strapi.server.httpServer)
      .post(`/api/auctions/${auction.id}/bids`)
      .set('accept', 'application/json')
      .set('Content-Type', 'application/json')
      .set('Authorization', `Bearer ${authenticatedUserJwt}`)
      .send({
        data: {
          amount: 90,
        },
      })
      .expect('Content-Type', /json/)
      .expect(400)
  })

  it('should not authenticated user be able to do a bid more than the min bid for desc auction', async () => {
    const auction = await createAuction({
      promotion: primaryPromotion.id,
      direction: 'desc',
    })

    await createBid({
      bidder: authenticatedUser.id,
      auction: auction.id,
      amount: 90,
    })

    await request(strapi.server.httpServer)
      .post(`/api/auctions/${auction.id}/bids`)
      .set('accept', 'application/json')
      .set('Content-Type', 'application/json')
      .set('Authorization', `Bearer ${authenticatedUserJwt}`)
      .send({
        data: {
          amount: 100,
        },
      })
      .expect('Content-Type', /json/)
      .expect(400)
  })

  it('should not authenticated user be able to do a bid after auction is completed', async () => {
    const auction = await createAuction({
      promotion: primaryPromotion.id,
      status: 'completed',
    })

    await request(strapi.server.httpServer)
      .post(`/api/auctions/${auction.id}/bids`)
      .set('accept', 'application/json')
      .set('Content-Type', 'application/json')
      .set('Authorization', `Bearer ${authenticatedUserJwt}`)
      .send({
        data: {
          amount: 90,
        },
      })
      .expect('Content-Type', /json/)
      .expect(400)
  })

  it('should not public user be able to do a bid', async () => {
    await request(strapi.server.httpServer)
      .post(`/api/auctions/${primaryAuction.id}/bids`)
      .set('accept', 'application/json')
      .set('Content-Type', 'application/json')
      .send({
        data: {
          amount: 100,
        },
      })
      .expect('Content-Type', /json/)
      .expect(403)
  })

  it('should not manager user be able to get auctions', async () => {
    await request(strapi.server.httpServer)
      .get(`/api/auctions`)
      .set('accept', 'application/json')
      .set('Content-Type', 'application/json')
      .set('Authorization', `Bearer ${managerUserJwt}`)
      .expect('Content-Type', /json/)
      .expect(403)
  })

  it('should not manager user be able to get last auction bid', async () => {
    await request(strapi.server.httpServer)
      .get(`/api/auctions/${primaryAuction.id}/bids/latest`)
      .set('accept', 'application/json')
      .set('Content-Type', 'application/json')
      .set('Authorization', `Bearer ${managerUserJwt}`)
      .expect('Content-Type', /json/)
      .expect(403)
  })

  it('should not manager user be able to do a bid', async () => {
    await request(strapi.server.httpServer)
      .get(`/api/auctions/${primaryAuction.id}/bids/latest`)
      .set('accept', 'application/json')
      .set('Content-Type', 'application/json')
      .set('Authorization', `Bearer ${managerUserJwt}`)
      .expect('Content-Type', /json/)
      .expect(403)
  })

  it('should public user is able to complete the auction and get coupon', async () => {
    const auction = await createAuction({
      promotion: primaryPromotion.id,
      status: 'active',
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
      .expect(200)

    expect(emailSendMock).toBeCalledTimes(1)

    await request(strapi.server.httpServer)
      .get(`/api/auctions/${auction.id}`)
      .set('accept', 'application/json')
      .set('Content-Type', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
      .then(({ body: { data } }) => {
        expect(data.attributes.status).toBe('completed')
      })
  })

  it('should not public user be able to complete the already completed auction', async () => {
    const auction = await createAuction({
      promotion: primaryPromotion.id,
      status: 'completed',
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
