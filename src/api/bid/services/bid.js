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
}))
