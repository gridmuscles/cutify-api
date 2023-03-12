'use strict'

/**
 * promotion controller
 */

const { createCoreController } = require('@strapi/strapi').factories

module.exports = createCoreController('api::promotion.promotion', ({ strapi }) => ({
  async requestCoupon(ctx) {
    try {
      const promotion = await super.findOne(ctx)

      const coupon = await strapi.service('api::coupon.coupon').create({
        data: {
          title: promotion.data.attributes.title,
          title_pl: promotion.data.attributes.title_pl,
          title_ua: promotion.data.attributes.title_ua,
          title_ru: promotion.data.attributes.title_ru,
          promotion: promotion.data.id,
          email: ctx.request.body.email,
        },
        populate: '*',
      })

      await strapi.plugins['email'].services.email.send({
        to: ctx.request.body.email,
        subject: 'Trifle.com - Your promo is ready',
        text: 'Thanks for choose this one',
        html: `<div>
          <a href="${ctx.request.host}/coupons/${coupon.id}">Open Link</a>
        </div>`,
      })

      return coupon
    } catch (err) {
      strapi.log.error(err)
      ctx.badRequest()
    }
  },
}))
