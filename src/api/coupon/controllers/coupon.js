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

  async verify(ctx) {
    try {
      const { uuidList } = ctx.request.body.data

      if (!uuidList) {
        throw new Error('UUID List is required.')
      }

      const { count } = await strapi
        .service('api::coupon.coupon')
        .verifyAsManager({ uuidList, managerId: ctx.state.user.id })

      return { data: { count } }
    } catch (err) {
      strapi.log.error(err.message)
      ctx.badRequest(err.message, err.details)
    }
  },
}))
