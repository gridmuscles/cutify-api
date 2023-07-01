'use strict'

/**
 * bid service
 */

const { createCoreService } = require('@strapi/strapi').factories

module.exports = createCoreService('api::bid.bid', () => ({
  async findAuctionLatestBid({ auctionId }) {
    const bids = await strapi.entityService.findMany('api::bid.bid', {
      filters: {
        auction: auctionId,
      },
      sort: { createdAt: 'desc' },
      start: 0,
      limit: 1,
    })

    return bids[0] ?? null
  },

  async findPopulatedAuctionLatestBid({ auctionId }) {
    const bids = await strapi.entityService.findMany('api::bid.bid', {
      filters: {
        auction: auctionId,
      },
      sort: { createdAt: 'desc' },
      start: 0,
      limit: 1,
      populate: {
        bidder: {
          fields: ['id', 'email'],
        },
      },
    })

    return bids[0] ?? null
  },

  async completeAuction({ auctionId }) {
    try {
      const auction = await super.findOne(auctionId)
      if (auction.status !== 'active') {
        throw new Error()
      }

      await strapi.service('api::auction.auction').update(auction.id, {
        data: {
          status: 'completed',
        },
      })

      return true
    } catch (err) {
      strapi.log.error(err)
      throw new Error()
    }
  },

  async verifyAuction({ auctionId }) {
    try {
      const auction = await super.findOne(auctionId)
      if (auction.status !== 'completed') {
        throw new Error()
      }

      await strapi.service('api::auction.auction').update(auction.id, {
        data: {
          status: 'verified',
        },
      })

      return true
    } catch (err) {
      strapi.log.error(err)
      throw new Error()
    }
  },
}))
