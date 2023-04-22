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
      const auction = await strapi
        .service('api::auction.auction')
        .findOne(ctx.params.id)

      if (auction.status === 'completed') {
        throw new Error()
      }

      const { id: bidderId } = ctx.state.user

      const latestBid = await strapi
        .service('api::auction.auction')
        .findAuctionLatestBid({ auctionId: auction.id })

      const { direction, step, startPrice } = auction

      const amountToCompare = latestBid ? latestBid.amount : startPrice

      if (direction === 'desc' && amountToCompare <= step) {
        throw new Error()
      }

      ctx.request.body.data = {
        bidder: bidderId,
        auction: auction.id,
        amount:
          direction === 'desc'
            ? amountToCompare - step
            : amountToCompare + step,
      }

      return strapi.controller('api::bid.bid').create(ctx)
    } catch (err) {
      strapi.log.error(err)
      ctx.badRequest()
    }
  },
}))
