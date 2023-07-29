'use strict'

const { getCouponListUrl } = require('../../../utils/dynamic-link')

/**
 * report controller
 */

const { createCoreController } = require('@strapi/strapi').factories

module.exports = createCoreController('api::report.report', () => ({
  async create(ctx) {
    try {
      const config = strapi.config.get('server')
      const { locale } = await this.sanitizeQuery(ctx)

      let reportMessage = ''

      if (ctx.request.body.data.coupons) {
        const results = await strapi.entityService.findMany(
          'api::coupon.coupon',
          {
            filters: {
              uuid: { $in: ctx.request.body.data.coupons },
            },
            populate: ['promotion'],
          }
        )

        const link = await strapi.services[
          'api::shortener.shortener'
        ].getShortUrl({
          url: getCouponListUrl({
            host: config.web.host,
            locale,
            promotionId: results[0].promotion.id,
            uuidList: ctx.request.body.data.coupons,
          }),
        })

        reportMessage += `Phone: ${results[0].phone} Link:${link}`

        ctx.request.body.data = {
          coupons: results.map(({ id }) => Number(id)),
        }
      }

      await strapi.plugins['email'].services.email.send({
        to: 'kosmokry@gmail.com',
        subject: 'You have new report!',
        html: reportMessage,
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
