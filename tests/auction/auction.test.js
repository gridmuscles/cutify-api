const request = require('supertest')
const { JEST_TIMEOUT } = require('./../helpers')
const { setupStrapi, stopStrapi } = require('./../helpers/strapi')

const { createAuction, clearAuctions } = require('./auction.factory')
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

  let primaryAuction

  beforeEach(async () => {
    const [user, jwt] = await createUser({ type: 'authenticated' })
    authenticatedUser = user
    authenticatedUserJwt = jwt

    primaryAuction = await createAuction()
  })

  afterEach(async () => {
    await clearBids()
    await clearAuctions()
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
          expect(data.attributes.auction).toBeUndefined()
          expect(data.attributes.bidder).toBeUndefined()
        })
    }
  )

  it('should authenticated user be able to do a bid for asc auction', async () => {
    const auction = await createAuction({
      direction: 'asc',
      startPrice: 100,
    })

    await request(strapi.server.httpServer)
      .post(`/api/auctions/${auction.id}/bids`)
      .set('accept', 'application/json')
      .set('Content-Type', 'application/json')
      .set('Authorization', `Bearer ${authenticatedUserJwt}`)
      .expect('Content-Type', /json/)
      .then(({ body: { data } }) => {
        expect(data.attributes.amount).toBe(110)
      })

    await request(strapi.server.httpServer)
      .post(`/api/auctions/${auction.id}/bids`)
      .set('accept', 'application/json')
      .set('Content-Type', 'application/json')
      .set('Authorization', `Bearer ${authenticatedUserJwt}`)
      .expect('Content-Type', /json/)
      .then(({ body: { data } }) => {
        expect(data.attributes.amount).toBe(120)
      })
  })

  it('should authenticated user be able to do a bid for desc auction', async () => {
    const auction = await createAuction({
      direction: 'desc',
      startPrice: 100,
    })

    await request(strapi.server.httpServer)
      .post(`/api/auctions/${auction.id}/bids`)
      .set('accept', 'application/json')
      .set('Content-Type', 'application/json')
      .set('Authorization', `Bearer ${authenticatedUserJwt}`)
      .expect('Content-Type', /json/)
      .then(({ body: { data } }) => {
        expect(data.attributes.amount).toBe(90)
        expect(data.attributes.auction).toBeUndefined()
        expect(data.attributes.bidder).toBeUndefined()
      })

    await request(strapi.server.httpServer)
      .post(`/api/auctions/${auction.id}/bids`)
      .set('accept', 'application/json')
      .set('Content-Type', 'application/json')
      .set('Authorization', `Bearer ${authenticatedUserJwt}`)
      .expect('Content-Type', /json/)
      .then(({ body: { data } }) => {
        expect(data.attributes.amount).toBe(80)
      })
  })

  it('should not authenticated user be able to do a bid after auction is completed', async () => {
    const auction = await createAuction({
      status: 'completed',
    })

    await request(strapi.server.httpServer)
      .post(`/api/auctions/${auction.id}/bids`)
      .set('accept', 'application/json')
      .set('Content-Type', 'application/json')
      .set('Authorization', `Bearer ${authenticatedUserJwt}`)
      .expect('Content-Type', /json/)
      .expect(400)
  })

  it('should not authenticated user be able to do a bid if auction is verified', async () => {
    const auction = await createAuction({
      status: 'verified',
    })

    await request(strapi.server.httpServer)
      .post(`/api/auctions/${auction.id}/bids`)
      .set('accept', 'application/json')
      .set('Content-Type', 'application/json')
      .set('Authorization', `Bearer ${authenticatedUserJwt}`)
      .expect('Content-Type', /json/)
      .expect(400)
  })

  it('should not authenticated user be able to do a bid after exceed the auction user bids limit', async () => {
    const auction = await createAuction({
      userAttemptLimit: 2,
    })

    const [, jwt] = await createUser({ type: 'authenticated' })

    await request(strapi.server.httpServer)
      .post(`/api/auctions/${auction.id}/bids`)
      .set('accept', 'application/json')
      .set('Content-Type', 'application/json')
      .set('Authorization', `Bearer ${authenticatedUserJwt}`)
      .expect('Content-Type', /json/)
      .expect(200)

    await request(strapi.server.httpServer)
      .post(`/api/auctions/${auction.id}/bids`)
      .set('accept', 'application/json')
      .set('Content-Type', 'application/json')
      .set('Authorization', `Bearer ${jwt}`)
      .expect('Content-Type', /json/)
      .expect(200)

    await request(strapi.server.httpServer)
      .post(`/api/auctions/${auction.id}/bids`)
      .set('accept', 'application/json')
      .set('Content-Type', 'application/json')
      .set('Authorization', `Bearer ${jwt}`)
      .expect('Content-Type', /json/)
      .expect(200)

    await request(strapi.server.httpServer)
      .post(`/api/auctions/${auction.id}/bids`)
      .set('accept', 'application/json')
      .set('Content-Type', 'application/json')
      .set('Authorization', `Bearer ${jwt}`)
      .expect('Content-Type', /json/)
      .expect(400)
  })

  it.each([
    { type: 'public', code: 403 },
    { type: 'manager', code: 403 },
    { type: 'moderator', code: 403 },
  ])('should $type user is not able to do a bid', async ({ type, code }) => {
    const [, jwt] = await createUser({ type })

    const auction = await createAuction({
      status: 'active',
    })

    const req = request(strapi.server.httpServer)
      .post(`/api/auctions/${auction.id}/bids`)
      .set('accept', 'application/json')
      .set('Content-Type', 'application/json')

    if (jwt) {
      req.set('Authorization', `Bearer ${jwt}`)
    }

    req.expect('Content-Type', /json/).expect(code)
  })
})
