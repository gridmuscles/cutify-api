'use strict'

/**
 * coupon controller
 */

const { createCoreController } = require('@strapi/strapi').factories
const { parseMultipartData } = require('@strapi/utils')

const parseBody = (ctx) => {
  if (ctx.is('multipart')) {
    return parseMultipartData(ctx)
  }

  const { data } = ctx.request.body || {}

  return { data }
}

module.exports = createCoreController('api::coupon.coupon', () => ({
  async findByPromotionAndUuidList(ctx) {
    try {
      /* eslint-disable no-unused-vars */
      const { locale, ...query } = await this.sanitizeQuery(ctx)

      if (!ctx.request.query.filters?.uuid?.$in) {
        throw new Error()
      }

      if (ctx.params.promotionId) {
        ctx.request.query.filters.promotion = {
          id: ctx.params.promotionId,
        }
      }

      const results = await strapi.entityService.findMany(
        'api::coupon.coupon',
        {
          ...query,
        }
      )

      const promotion = results[0]?.promotion ?? null
      const promotionId = ctx.params.promotionId
        ? Number(ctx.params.promotionId)
        : promotion?.id ?? null

      if (results.some((c) => c.promotion?.id !== promotionId)) {
        throw new Error()
      }

      if (results.length !== ctx.request.query.filters.uuid.$in.length) {
        throw new Error()
      }

      const couponDescriptionFields = promotion
        ? Object.fromEntries(
            Object.entries(promotion).filter(([key]) =>
              key.startsWith('couponDescription')
            )
          )
        : {}

      const sanitizedOutput = await this.sanitizeOutput(results, ctx)

      for (let coupon of sanitizedOutput) {
        coupon.promotion = { ...coupon.promotion, ...couponDescriptionFields }
      }

      return this.transformResponse(sanitizedOutput)
    } catch (err) {
      strapi.log.error(err)
      ctx.badRequest(err.message, err.details)
    }
  },

  async verify(ctx) {
    try {
      const { uuidList } = ctx.request.body.data

      if (!uuidList) {
        throw new Error('UUID List is required.')
      }

      await strapi
        .service('api::coupon.coupon')
        .verifyAsManager({ uuidList, managerId: ctx.state.user.id })

      return true
    } catch (err) {
      strapi.log.error(err.message)
      ctx.badRequest(err.message, err.details)
    }
  },

  async verifyWithCode(ctx) {
    try {
      const { uuidList, code } = ctx.request.body.data

      if (!uuidList || !code) {
        throw new Error('UUID List and code is required.')
      }

      await strapi
        .service('api::coupon.coupon')
        .verifyWithCode({ uuidList, code })

      return true
    } catch (err) {
      strapi.log.error(err.message)
      ctx.badRequest(err.message, err.details)
    }
  },

  async verifyWithReceipt(ctx) {
    try {
      const { data, files } = parseBody(ctx)
      const { uuidList } = await this.sanitizeInput(data, ctx)

      const receipt = await strapi.service('api::receipt.receipt').create({
        data,
        files,
      })

      await strapi
        .service('api::coupon.coupon')
        .verifyWithReceipt({ uuidList, receipt })

      return true
    } catch (err) {
      strapi.log.error(err)
      ctx.badRequest(err.message, err.details)
    }
  },

  async downloadPdf(ctx) {
    try {
      const config = strapi.config.get('server')

      const sanitizedQueryParams = await this.sanitizeQuery(ctx)
      const {
        filters: {
          uuid: { $in: uuidList },
        },
        locale,
      } = sanitizedQueryParams

      const file = await strapi
        .service('api::coupon.coupon')
        .generateCouponListPdf({
          uuidList,
          locale,
          host: config.web.host,
        })

      ctx.body = file
      ctx.attachment(`coupons-${new Date().toISOString()}.pdf`)
    } catch (err) {
      strapi.log.error(err)
      ctx.badRequest(err.message, err.details)
    }
  },

  async getUserMeCoupons(ctx) {
    /* eslint-disable no-unused-vars */
    const { locale, filters, ...query } = await this.sanitizeQuery(ctx)

    try {
      const { results, pagination } = await strapi
        .service('api::coupon.coupon')
        .find({
          filters: {
            user: ctx.state?.user?.id,
            ...filters,
          },
          ...query,
        })

      const sanitizedOutput = await this.sanitizeOutput(results, ctx)
      return this.transformResponse(sanitizedOutput, { pagination })
    } catch (err) {
      strapi.log.error(err)
      ctx.badRequest()
    }
  },
}))
