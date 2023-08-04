'use strict'

const { parseISO, isAfter } = require('date-fns')

const { getCouponListSMSText } = require('../../../utils/coupons')
const { getCouponListUrl } = require('../../../utils/dynamic-link')

const { ERROR_CODES } = require('../../../utils/const')

/**
 * promotion controller
 */

const { createCoreController } = require('@strapi/strapi').factories

module.exports = createCoreController(
  'api::promotion.promotion',
  ({ strapi }) => ({
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

    async findCategoriesTop(ctx) {
      try {
        // eslint-disable-next-line no-unused-vars
        const { locale, pagination, sort, populate } = await this.sanitizeQuery(
          ctx
        )

        if (sort && sort.length > 1) {
          throw new Error()
        }

        const { results, pagination: resultsPagination } = await await strapi
          .service('api::promotion.promotion')
          .findCategoriesTop({
            sortBy: sort[0],
            pagination,
            populate,
          })

        const sanitizedResults = await this.sanitizeOutput(results, ctx)
        return this.transformResponse(sanitizedResults, {
          pagination: resultsPagination,
        })
      } catch (err) {
        strapi.log.error(err)
        ctx.badRequest()
      }
    },

    async requestCoupon(ctx) {
      const config = strapi.config.get('server')

      const { locale } = await this.sanitizeQuery(ctx)
      const { email, phone, count } = ctx.request.body
      const user = ctx.state.user

      try {
        if (!count || (!user && !phone)) {
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

        if (
          promotion.couponTotalLimit !== null &&
          promotion.couponsCount + count > promotion.couponTotalLimit
        ) {
          throw new Error(ERROR_CODES.TOO_MANY_COUPONS_FOR_SINGLE_USER)
        }

        const { results: userCoupons } = await strapi
          .service('api::coupon.coupon')
          .find({
            filters: {
              $or: [
                { ...(phone ? { phone: phone?.toLowerCase() } : {}) },
                { ...(email ? { email: email?.toLowerCase() } : {}) },
                { ...(user ? { user: user?.id } : {}) },
              ],
              promotion: promotion.id,
            },
          })

        if (
          promotion.couponUserLimit !== null &&
          userCoupons.length + count > promotion.couponUserLimit
        ) {
          throw new Error(ERROR_CODES.TOO_MANY_COUPONS_FOR_SINGLE_USER)
        }

        const couponUUIDList = await strapi
          .service('api::coupon.coupon')
          .createCouponBulk({
            count,
            promotionId: promotion.id,
            email: user ? user.email : email,
            phone: user ? user.phone : phone,
            userId: user?.id,
            locale,
          })

        const link = await strapi.services[
          'api::shortener.shortener'
        ].getShortUrl({
          url: getCouponListUrl({
            host: config.web.host,
            locale,
            promotionId: promotion.id,
            uuidList: couponUUIDList,
          }),
        })

        if (!link) {
          throw new Error()
        }

        await strapi.services['api::sms.sms'].sendSMS({
          phoneNumbers: [phone],
          body: getCouponListSMSText({
            title: `${promotion.discountTo}% ${promotion.title}`,
            link,
            locale,
            couponsAmount: couponUUIDList.length,
          }),
        })

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
