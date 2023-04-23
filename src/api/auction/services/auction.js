'use strict'

/**
 * auction service
 */

const { createCoreService } = require('@strapi/strapi').factories

module.exports = createCoreService('api::auction.auction', () => ({
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

  async completeAuction({ auctionId }) {
    try {
      const auction = await super.findOne(auctionId)
      if (auction.status === 'completed') {
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
}))
