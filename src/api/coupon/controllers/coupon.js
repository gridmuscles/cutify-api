'use strict'

/**
 * coupon controller
 */

const { createCoreController } = require('@strapi/strapi').factories

module.exports = createCoreController('api::coupon.coupon', () => ({
  async find(ctx) {
    if (!ctx.request.query.filters?.uuid?.$in) {
      ctx.request.query.filters = {
        ...(ctx.request.query.filters ?? {}),
        user: ctx.state?.user?.id ?? 0,
      }
    }

    return super.find(ctx)
  },
}))
