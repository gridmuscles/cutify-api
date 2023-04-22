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

      const { results: userBids } = await strapi.service('api::bid.bid').find({
        fields: ['id'],
        filters: { auction: auction.id, bidder: bidderId },
      })

      if (userBids.length >= auction.userAttemptLimit) {
        throw new Error()
      }

      const { direction, step, startPrice } = auction

      const amountToCompare = latestBid ? latestBid.amount : startPrice

      if (direction === 'desc' && amountToCompare <= step) {
        throw new Error()
      }

      const newBid = await strapi.service('api::bid.bid').create({
        data: {
          bidder: bidderId,
          auction: auction.id,
          amount:
            direction === 'desc'
              ? amountToCompare - step
              : amountToCompare + step,
        },
      })

      const { id, ...attributes } = await this.sanitizeOutput(newBid, ctx)

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
}))
