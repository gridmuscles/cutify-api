'use strict'

/**
 * receipt controller
 */

const { createCoreController } = require('@strapi/strapi').factories

module.exports = createCoreController('api::receipt.receipt', () => ({
  async create(ctx) {
    try {
      const { data: dataStr } = ctx.request.body
      const data = JSON.parse(dataStr)

      const receipt = await super.create(ctx)

      const { results: coupons } = await strapi
        .service('api::coupon.coupon')
        .find({
          filters: { uuid: { $in: data.uuidList } },
        })

      await strapi.service('api::receipt.receipt').update(receipt.data.id, {
        data: { coupons: coupons.map((c) => c.id) },
      })

      return receipt
    } catch (err) {
      strapi.log.error(err)
      ctx.badRequest(err.message, err.details)
    }
  },
}))
