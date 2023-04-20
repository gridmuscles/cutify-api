'use strict'

/**
 * auction controller
 */

const { createCoreController } = require('@strapi/strapi').factories

module.exports = createCoreController('api::auction.auction', ({ strapi }) => ({
  async findAuctionLatestBid(ctx) {
    try {
      const { id: auctionId } = ctx.params

      const latestBid = await strapi
        .service('api::auction.auction')
        .findAuctionLatestBid({ auctionId })

      if (!latestBid) {
        return { data: null }
      }

      const { id, ...attributes } = await this.sanitizeOutput(latestBid, ctx)

      return {
        data: {
          id,
          attributes,
        },
      }
    } catch (err) {
      strapi.log.error(err)
      ctx.badRequest()
    }
  },

  async createAuctionBid(ctx) {
    try {
      const { data: auction } = await super.findOne(ctx)

      if (auction.attributes.status === 'completed') {
        throw new Error()
      }

      const { id: bidderId } = ctx.state.user
      const { amount } = ctx.request.body.data

      const latestBid = await strapi
        .service('api::auction.auction')
        .findAuctionLatestBid({ auctionId: auction.id })

      const { direction } = auction.attributes
      if (
        (direction === 'asc' && latestBid.amount >= amount) ||
        (direction === 'desc' && latestBid.amount <= amount)
      ) {
        throw new Error()
      }

      ctx.request.body.data = {
        ...ctx.request.body.data,
        bidder: bidderId,
        auction: auction.id,
      }

      return strapi.controller('api::bid.bid').create(ctx)
    } catch (err) {
      strapi.log.error(err)
      ctx.badRequest()
    }
  },
}))
