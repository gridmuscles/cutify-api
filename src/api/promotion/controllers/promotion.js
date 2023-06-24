'use strict'

const { parseISO, isAfter } = require('date-fns')
const { ERROR_CODES } = require('../../../utils/const')
const { getCouponListEmail } = require('../../../utils/email')
const { getCouponListUrl } = require('../../../utils/dynamic-link')
const { getPromotionListPopulate } = require('../utils/populate')

/**
 * promotion controller
 */

const { createCoreController } = require('@strapi/strapi').factories

//TODO (Tests)
module.exports = createCoreController(
  'api::promotion.promotion',
  ({ strapi }) => ({
    async requestCoupon(ctx) {
      const config = strapi.config.get('server')

      const sanitizedQueryParams = await this.sanitizeQuery(ctx)
      ctx.request.query = sanitizedQueryParams

      const { locale } = sanitizedQueryParams
      const { email, count } = ctx.request.body

      try {
        if (!email || !count) {
          throw new Error(ERROR_CODES.REQUIRED_FIELDS_MISSING)
        }

        const promotion = await strapi
          .service('api::promotion.promotion')
          .findOne(ctx)

        const { dateTimeUntil, publishedAt, auction } = promotion

        if (!publishedAt) {
          throw new Error(
            ERROR_CODES.UNABLE_TO_REQUEST_COUPON_FOR_DRAFT_PROMOTION
          )
        }

        if (auction) {
          throw new Error(
            ERROR_CODES.UNABLE_TO_REQUEST_COUPON_FOR_AUCTION_PROMOTION
          )
        }

        if (!dateTimeUntil) {
          throw new Error(ERROR_CODES.DATE_TIME_UNTIL_IS_NOT_DEFINED)
        }

        if (isAfter(new Date(), parseISO(dateTimeUntil))) {
          throw new Error(ERROR_CODES.PROMOTION_IS_FINISHED)
        }

        const { results: userCoupons } = await strapi
          .service('api::coupon.coupon')
          .find({
            filters: {
              email: email.toLowerCase(),
              promotion: promotion.id,
            },
          })

        if (userCoupons.length + count > 10) {
          throw new Error(ERROR_CODES.TOO_MANY_COUPONS_FOR_SINGLE_USER)
        }

        const couponUUIDList = await Promise.all(
          [...Array(count).keys()].map(() =>
            strapi.service('api::coupon.coupon').create({
              data: {
                promotion: promotion.id,
                email,
                uuid: `${Math.floor(
                  100000000 + Math.random() * 900000000
                )}-${Math.floor(200000000 + Math.random() * 800000000)}`,
                state: 'active',
              },
            })
          )
        ).then((coupons) => coupons.map(({ uuid }) => uuid))

        await strapi.plugins['email'].services.email.send(
          getCouponListEmail({
            title: `${promotion.discountTo}% ${promotion.title}`,
            email,
            link: getCouponListUrl({
              host: config.web.host,
              locale,
              promotionId: promotion.id,
              uuidList: couponUUIDList,
            }),
            locale,
            couponsAmount: couponUUIDList.length,
          })
        )

        return { data: couponUUIDList }
      } catch (err) {
        strapi.log.error(err)
        ctx.badRequest()
      }
    },

    async like(ctx) {
      try {
        const sanitizedQueryParams = await this.sanitizeQuery(ctx)
        ctx.request.query = sanitizedQueryParams

        const promotion = await strapi
          .service('api::promotion.promotion')
          .findOne(ctx)

        if (!promotion) {
          return
        }

        const likesCount = promotion.likesCount ? promotion.likesCount + 1 : 1
        await strapi.service('api::promotion.promotion').update(promotion.id, {
          data: {
            likesCount,
          },
        })

        return {
          data: {
            likesCount,
          },
        }
      } catch (err) {
        strapi.log.error(err)
        ctx.badRequest()
      }
    },

    async findOne(ctx) {
      try {
        const sanitizedQueryParams = await this.sanitizeQuery(ctx)
        ctx.request.query = sanitizedQueryParams

        let promotion
        if (Number(ctx.params.id) != ctx.params.id) {
          promotion = await strapi
            .service('api::promotion.promotion')
            .findOneBySlug(ctx)
        } else {
          promotion = await strapi
            .service('api::promotion.promotion')
            .findOne(ctx)
        }
        if (!promotion) {
          throw new Error(ERROR_CODES.PROMOTION_NOT_FOUND)
        }
        const { views } = ctx.request.query
        await strapi.service('api::promotion.promotion').update(promotion.id, {
          data: {
            viewsCount:
              views === 'true'
                ? promotion.viewsCount + 1
                : promotion.viewsCount,
          },
        })

        const sanitizedResult = await this.sanitizeOutput(promotion, ctx)
        return this.transformResponse(sanitizedResult)
      } catch (err) {
        strapi.log.error(err)
        ctx.badRequest()
      }
    },

    async verifyAuction(ctx) {
      const config = strapi.config.get('server')

      try {
        const sanitizedQueryParams = await this.sanitizeQuery(ctx)
        ctx.request.query = sanitizedQueryParams

        const { locale } = ctx.request.query

        const promotion = await strapi
          .service('api::promotion.promotion')
          .findOne(ctx)

        const latestBid = await strapi
          .service('api::auction.auction')
          .findPopulatedAuctionLatestBid({ auctionId: promotion.auction.id })

        await strapi.service('api::auction.auction').verifyAuction({
          auctionId: promotion.auction.id,
        })

        const coupon = await strapi.service('api::coupon.coupon').create({
          data: {
            promotion: promotion.id,
            email: latestBid.bidder.email,
            user: latestBid.bidder.id,
            state: 'active',
          },
        })

        await strapi.plugins['email'].services.email.send(
          getCouponListEmail({
            title: `${promotion.discountTo}% ${promotion.title}`,
            email: latestBid.bidder.email,
            link: getCouponListUrl({
              host: config.web.host,
              locale,
              promotionId: promotion.id,
              uuidList: [coupon.uuid],
            }),
            locale,
            couponsAmount: 1,
          })
        )

        const { id } = coupon
        return { id }
      } catch (err) {
        strapi.log.error(err)
        ctx.badRequest()
      }
    },

    async completeAuction(ctx) {
      try {
        const sanitizedQueryParams = await this.sanitizeQuery(ctx)
        ctx.request.query = sanitizedQueryParams

        const promotion = await strapi
          .service('api::promotion.promotion')
          .findOne(ctx)

        await strapi.service('api::auction.auction').completeAuction({
          auctionId: promotion.auction.id,
        })

        return true
      } catch (err) {
        strapi.log.error(err)
        ctx.badRequest()
      }
    },

    async findCoupons(ctx) {
      try {
        const {
          transformResponse: transformCouponResponse,
          sanitizeOutput: sanitizeCouponOutput,
        } = await strapi.controller('api::coupon.coupon')

        const locations = await strapi.entityService.findMany(
          'api::location.location',
          {
            filters: {
              managers: {
                id: ctx.state.user.id,
              },
            },
            populate: {
              organization: {
                populate: {
                  promotions: true,
                },
              },
            },
          }
        )

        const organizationIds = locations.reduce((acc, location) => {
          return [...acc, location.organization.id]
        }, [])

        const { results, pagination } = await strapi
          .service('api::coupon.coupon')
          .find({
            filters: {
              promotion: {
                organization: {
                  id: {
                    $in: organizationIds,
                  },
                },
              },
            },
          })

        const sanitizedResults = await sanitizeCouponOutput(results, ctx)
        return transformCouponResponse(sanitizedResults, { pagination })
      } catch (err) {
        strapi.log.error(err)
        ctx.badRequest()
      }
    },

    async findManagerPromotions(ctx) {
      try {
        const locations = await strapi.entityService.findMany(
          'api::location.location',
          {
            filters: {
              managers: {
                id: ctx.state.user.id,
              },
            },
            populate: {
              organization: {
                populate: {
                  promotions: true,
                },
              },
            },
          }
        )

        if (!locations[0] || !locations[0].organization) {
          throw new Error()
        }

        ctx.request.query.filters = {
          ...ctx.request.query.filters,
          organization: {
            id: locations[0].organization.id,
          },
        }

        return super.find(ctx)
      } catch (err) {
        strapi.log.error(err)
        ctx.badRequest()
      }
    },

    async getPromotionConfirmationCode(ctx) {
      try {
        const locations = await strapi.entityService.findMany(
          'api::location.location',
          {
            filters: {
              managers: {
                id: ctx.state.user.id,
              },
            },
            populate: {
              organization: {
                populate: {
                  promotions: true,
                },
              },
            },
          }
        )

        const promotion = locations[0]?.organization.promotions.find(
          (promotion) => promotion.id === Number(ctx.params.id)
        )

        if (!promotion) {
          throw new Error()
        }

        return {
          data: {
            confirmationCode: promotion.confirmationCode,
          },
        }
      } catch (err) {
        strapi.log.error(err)
        ctx.badRequest()
      }
    },

    async findRecommendations(ctx) {
      const { locale } = await this.sanitizeQuery(ctx)

      const results = await await strapi
        .service('api::promotion.promotion')
        .findRecommendations({
          promotionId: ctx.params.id,
          populate: getPromotionListPopulate({ locale }),
        })

      const sanitizedResult = await this.sanitizeOutput(results, ctx)
      return this.transformResponse(sanitizedResult)
    },

    async findSimilar(ctx) {
      const { locale } = await this.sanitizeQuery(ctx)

      const results = await await strapi
        .service('api::promotion.promotion')
        .findRecommendations({
          promotionId: ctx.params.id,
          populate: getPromotionListPopulate({ locale }),
        })

      const sanitizedResult = await this.sanitizeOutput(results, ctx)
      return this.transformResponse(sanitizedResult)
    },
  })
)
