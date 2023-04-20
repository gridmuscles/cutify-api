const request = require('supertest')
const { JEST_TIMEOUT } = require('./../helpers')
const { setupStrapi, stopStrapi } = require('./../helpers/strapi')

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

  let primaryAuction

  beforeAll(async () => {
    const [user1, jwt1] = await createUser({ type: 'authenticated' })
    authenticatedUser = user1
    authenticatedUserJwt = jwt1

    const [, jwt2] = await createUser({ type: 'manager' })
    managerUserJwt = jwt2

    primaryAuction = await createAuction({})
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
})
