'use strict'

/**
 * report controller
 */

const { createCoreController } = require('@strapi/strapi').factories

module.exports = createCoreController('api::report.report', () => ({
  async create(ctx) {
    try {
      if (ctx.request.body.data.coupons) {
        const results = await strapi.entityService.findMany(
          'api::coupon.coupon',
          {
            filters: {
              uuid: { $in: ctx.request.body.data.coupons },
            },
          }
        )

        ctx.request.body.data = {
          coupons: results.map(({ id }) => Number(id)),
        }
      }

      await strapi.plugins['email'].services.email.send({
        to: 'kosmokry@gmail.com',
        subject: 'You have new report!',
        html: `You have new report!`,
      })

      const report = await strapi.entityService.create('api::report.report', {
        data: ctx.request.body.data,
      })

      const sanitizedResults = await this.sanitizeOutput(report, ctx)
      return this.transformResponse(sanitizedResults)
    } catch (err) {
      strapi.log.error(err)
      ctx.badRequest()
    }
  },
}))
