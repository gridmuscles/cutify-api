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
  async findByUuidList(ctx) {
    try {
      if (!ctx.request.query.filters?.uuid?.$in) {
        throw new Error()
      }
      return super.find(ctx)
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
        throw new Error('UUID List is required.')
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
        .verifyCouponList({ uuidList, receiptId: receipt.id })

      return true
    } catch (err) {
      strapi.log.error(err)
      ctx.badRequest(err.message, err.details)
    }
  },
}))
