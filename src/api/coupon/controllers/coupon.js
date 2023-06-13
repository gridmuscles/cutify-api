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
      if (!ctx.request.query.filters?.uuid?.$in) {
        throw new Error()
      }

      if (ctx.params.promotionId) {
        ctx.request.query.filters.promotion = {
          id: ctx.params.promotionId,
        }
      }

      const result = await super.find(ctx)
      const promotionId = result.data[0]?.attributes.promotion.data?.id

      if (
        !ctx.params.promotionId &&
        result.data.some((c) => c.attributes.promotion.data.id !== promotionId)
      ) {
        throw new Error()
      }

      if (result.data.length !== ctx.request.query.filters.uuid.$in.length) {
        throw new Error()
      }

      return result
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
          origin: ctx.request.header.origin,
        })

      ctx.body = file
      ctx.attachment(`coupons-${new Date().toISOString()}.pdf`)
    } catch (err) {
      strapi.log.error(err)
      ctx.badRequest(err.message, err.details)
    }
  },
}))
