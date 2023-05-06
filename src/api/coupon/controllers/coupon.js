'use strict'

/**
 * coupon controller
 */

const { createCoreController } = require('@strapi/strapi').factories

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
}))
