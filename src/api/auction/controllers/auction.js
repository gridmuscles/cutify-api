'use strict'

const { getCouponListEmail } = require('../../../utils/email')
const { getCouponListUrl } = require('../../../utils/dynamic-link')

/**
 * auction controller
 */

const { createCoreController } = require('@strapi/strapi').factories

module.exports = createCoreController('api::auction.auction', () => ({
  async verifyAuction(ctx) {
    const config = strapi.config.get('server')

    try {
      const { locale } = await this.sanitizeQuery(ctx)

      const auction = await strapi
        .service('api::auction.auction')
        .findOne(ctx.params.auctionId, {
          populate: ['promotion'],
        })

      const latestBid = await strapi
        .service('api::auction.auction')
        .findPopulatedAuctionLatestBid({ auctionId: auction.id })

      await strapi.service('api::auction.auction').verifyAuction({
        auctionId: auction.id,
      })

      const couponUUIDList = await strapi
        .service('api::coupon.coupon')
        .createCouponBulk({
          count: 1,
          promotionId: auction.promotion.id,
          email: latestBid.bidder.email,
          userId: latestBid.bidder.id,
        })

      await strapi.plugins['email'].services.email.send(
        getCouponListEmail({
          title: `${auction.promotion.discountTo}% ${auction.promotion.title}`,
          email: latestBid.bidder.email,
          link: getCouponListUrl({
            host: config.web.host,
            locale,
            promotionId: auction.promotion.id,
            uuidList: couponUUIDList,
          }),
          locale,
          couponsAmount: 1,
        })
      )

      return true
    } catch (err) {
      strapi.log.error(err)
      ctx.badRequest()
    }
  },

  async completeAuction(ctx) {
    try {
      const auction = await strapi
        .service('api::auction.auction')
        .findOne(ctx.params.auctionId, {
          populate: ['promotion'],
        })

      await strapi.service('api::auction.auction').completeAuction({
        auctionId: auction.promotion.id,
      })

      return true
    } catch (err) {
      strapi.log.error(err)
      ctx.badRequest()
    }
  },
}))
