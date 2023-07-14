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

      const { results, pagination } = await strapi
        .service('api::coupon.coupon')
        .find({ ...query })

      const promotionId = results[0]?.promotion?.id

      if (
        !ctx.params.promotionId &&
        results.some((c) => c.promotion.id !== promotionId)
      ) {
        throw new Error()
      }

      if (results.length !== ctx.request.query.filters.uuid.$in.length) {
        throw new Error()
      }

      const transformedResults = await this.transformResponse(results, ctx)

      const output = await this.sanitizeOutput(transformedResults, {
        pagination,
      })

      const couponDescriptionFields = Object.fromEntries(
        Object.entries(results[0].promotion).filter(([key]) =>
          key.startsWith('couponDescription')
        )
      )

      for (let coupon of output.data) {
        coupon.attributes.promotion.data.attrributes = {
          ...coupon.attributes.promotion.data.attrributes,
          ...couponDescriptionFields,
        }
      }

      return output
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

      const sanitizedResults = await this.transformResponse(results, ctx)
      return this.sanitizeOutput(sanitizedResults, { pagination })
    } catch (err) {
      strapi.log.error(err)
      ctx.badRequest()
    }
  },
}))
