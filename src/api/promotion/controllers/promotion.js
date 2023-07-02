'use strict'

const { parseISO, isAfter } = require('date-fns')

const { getCouponListEmail } = require('../../../utils/email')
const { getCouponListUrl } = require('../../../utils/dynamic-link')

const { ERROR_CODES } = require('../../../utils/const')

/**
 * promotion controller
 */

const { createCoreController } = require('@strapi/strapi').factories

module.exports = createCoreController(
  'api::promotion.promotion',
  ({ strapi }) => ({
    async find(ctx) {
      const { data, meta } = await super.find(ctx)

      const coupons = await Promise.all(
        data.map(async ({ id }) =>
          strapi
            .service('api::promotion.promotion')
            .getPromotionCouponsCount({ promotionId: id })
        )
      )

      return {
        data: data.map(({ id, attributes }, i) => ({
          id,
          attributes: {
            ...attributes,
            couponsCount: coupons[i],
          },
        })),
        meta,
      }
    },

    async findOne(ctx) {
      try {
        const promotion = await super.findOne(ctx)

        if (!promotion) {
          return ctx.notFound({ code: ERROR_CODES.PROMOTION_NOT_FOUND })
        }

        promotion.data.attributes.couponsCount = await strapi
          .service('api::promotion.promotion')
          .getPromotionCouponsCount({
            promotionId: promotion.data.id,
          })

        return promotion
      } catch (err) {
        strapi.log.error(err)
        ctx.badRequest()
      }
    },

    async findBySlug(ctx) {
      try {
        const { views, ...query } = await this.sanitizeQuery(ctx)

        const promotion = await strapi
          .service('api::promotion.promotion')
          .findOneBySlug({ slug: ctx.params.slug, query })

        if (!promotion) {
          return ctx.notFound({ code: ERROR_CODES.PROMOTION_NOT_FOUND })
        }

        if (views) {
          await strapi
            .service('api::promotion.promotion')
            .incrementPromotionViews({
              promotionId: promotion.id,
            })
        }

        promotion.couponsCount = await strapi
          .service('api::promotion.promotion')
          .getPromotionCouponsCount({
            promotionId: promotion.id,
          })

        const sanitizedResult = await this.sanitizeOutput(promotion, ctx)
        return this.transformResponse(sanitizedResult)
      } catch (err) {
        strapi.log.error(err)
        ctx.badRequest()
      }
    },

    async findManagerPromotionList(ctx) {
      try {
        // eslint-disable-next-line no-unused-vars
        const { locale, ...query } = await this.sanitizeQuery(ctx)

        const { results, pagination } = await strapi
          .service('api::promotion.promotion')
          .findByManager({
            managerId: ctx.state.user.id,
            query: {
              pagination: { page: 1, pageSize: 4 },
              ...query,
            },
          })

        if (!results) {
          throw new Error()
        }

        const sanitizedResults = await this.sanitizeOutput(results, ctx)
        return this.transformResponse(sanitizedResults, { pagination })
      } catch (err) {
        strapi.log.error(err)
        ctx.badRequest()
      }
    },

    async findRecommendations(ctx) {
      const sanitizedQuery = await this.sanitizeQuery(ctx)

      const { results, pagination } = await await strapi
        .service('api::promotion.promotion')
        .findRecommendations({
          promotionId: ctx.params.id,
          query: {
            pagination: { page: 1, pageSize: 4 },
            ...sanitizedQuery,
          },
        })

      const sanitizedResults = await this.sanitizeOutput(results, ctx)
      return this.transformResponse(sanitizedResults, { pagination })
    },

    async findSimilar(ctx) {
      const sanitizedQuery = await this.sanitizeQuery(ctx)

      const { results, pagination } = await await strapi
        .service('api::promotion.promotion')
        .findSimilar({
          promotionId: ctx.params.id,
          query: {
            pagination: { page: 1, pageSize: 4 },
            ...sanitizedQuery,
          },
        })

      const sanitizedResults = await this.sanitizeOutput(results, ctx)
      return this.transformResponse(sanitizedResults, { pagination })
    },

    async requestCoupon(ctx) {
      const config = strapi.config.get('server')

      const { locale } = await this.sanitizeQuery(ctx)
      const { email, count } = ctx.request.body
      const userId = ctx.state.user?.id ?? null

      try {
        if (!email || !count) {
          throw new Error(ERROR_CODES.REQUIRED_FIELDS_MISSING)
        }

        const promotion = await strapi
          .service('api::promotion.promotion')
          .findOne(ctx.params.id, {
            populate: ['auction'],
          })

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
                user: userId,
                promotion: promotion.id,
                email,
                uuid: `${Math.floor(
                  100000000 + Math.random() * 900000000
                )}-${Math.floor(200000000 + Math.random() * 800000000)}`,
                state: 'active',
              },
            })
          )
        ).then((coupons) => {
          return coupons.map(({ uuid }) => uuid)
        })

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
        const promotion = await strapi
          .service('api::promotion.promotion')
          .findOne(ctx.params.id)

        if (!promotion) {
          return ctx.notFound()
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

    async getPromotionConfirmationCode(ctx) {
      try {
        const code = await strapi
          .service('api::promotion.promotion')
          .getPromotionConfirmationCode({
            promotionId: ctx.params.id,
            managerId: ctx.state.user.id,
          })

        if (!code) {
          return ctx.badRequest()
        }

        return {
          data: {
            confirmationCode: code,
          },
        }
      } catch (err) {
        strapi.log.error(err)
        ctx.badRequest()
      }
    },
  })
)
