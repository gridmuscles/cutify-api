'use strict'

/**
 * bid controller
 */

const utils = require('@strapi/utils')
const { ERROR_CODES } = require('../../../utils/const')
const { ValidationError } = utils.errors

const { createCoreController } = require('@strapi/strapi').factories

module.exports = createCoreController('api::bid.bid', ({ strapi }) => ({
  async findAuctionLatestBid(ctx) {
    try {
      const { auctionId } = ctx.params

      const latestBid = await strapi
        .service('api::bid.bid')
        .findAuctionLatestBid({ auctionId })

      if (!latestBid) {
        return { data: null }
      }

      const sanitizedOutput = await this.sanitizeOutput(latestBid, ctx)
      return this.transformResponse(sanitizedOutput)
    } catch (err) {
      strapi.log.error(err)
      ctx.badRequest()
    }
  },

  async createAuctionBid(ctx) {
    try {
      const auction = await strapi
        .service('api::auction.auction')
        .findOne(ctx.params.auctionId)

      if (auction.status !== 'active') {
        throw new Error()
      }

      const { id: bidderId } = ctx.state.user

      const latestBid = await strapi
        .service('api::bid.bid')
        .findAuctionLatestBid({ auctionId: auction.id })

      const { results: userBids } = await strapi.service('api::bid.bid').find({
        fields: ['id'],
        filters: { auction: auction.id, bidder: bidderId },
      })

      if (userBids.length >= auction.userAttemptLimit) {
        throw new ValidationError('Bid limit is exceeded for current user', {
          code: ERROR_CODES.USER_BID_LIMIT_EXCEEDED,
        })
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

      const sanitizedOutput = await this.sanitizeOutput(newBid, ctx)
      return this.transformResponse(sanitizedOutput)
    } catch (err) {
      strapi.log.error(err)
      ctx.badRequest(err.message, err.details)
    }
  },
}))
