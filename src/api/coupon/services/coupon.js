'use strict'

/**
 * coupon service
 */

const { createCoreService } = require('@strapi/strapi').factories

module.exports = createCoreService('api::coupon.coupon', () => ({
  async create(ctx) {
    ctx.data = {
      ...ctx.data,
      uuid: `${Math.floor(100000000 + Math.random() * 900000000)}-${Math.floor(
        200000000 + Math.random() * 800000000
      )}`,
    }

    return super.create(ctx)
  },

  async verify(ctx) {
    return strapi.service('api::coupon.coupon').update(ctx.params.id, {
      data: { state: 'verified' },
    })
  },

  async verifyWithCode(ctx) {
    return strapi.service('api::coupon.coupon').update(ctx.params.id, {
      data: { state: 'verified' },
    })
  },
}))
