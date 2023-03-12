'use strict'

/**
 * promotion controller
 */

const { createCoreController } = require('@strapi/strapi').factories

const TEMPLATE_DATA = {
  en: {
    title: 'Your coupon has been activated!',
    greetings: 'Hello!',
    description: 'To use your coupon, click on the "Open Coupon" button below.',
    linkText: 'Open Coupon',
    subject: 'Trifle.com - Your Coupon Delivered!',
  },
  pl: {
    title: 'Twój kupon został aktywowany!',
    greetings: 'Witaj!',
    description: 'Aby skorzystać z kuponu, kliknij przycisk "Otwórz kupon" poniżej.',
    linkText: 'Otwórz kupon',
    subject: 'Trifle.com - Twój kupon dostarczony!',
  },
  ua: {
    title: 'Ваш купон активовано!',
    greetings: 'Вітаємо!',
    description: 'Щоб скористатись купоном, натисніть на кнопку "Відкрити купон" нижче.',
    linkText: 'Відкрити купон',
    subject: 'Trifle.com - Ваш купон доставлено!',
  },
  ru: {
    title: 'Ваш купон активирован!',
    greetings: 'Здравствуйте!',
    description: 'Чтобы воспользоваться купоном, нажмите на кнопку "Открыть купон"',
    linkText: 'Открыть купон',
    subject: 'Trifle.com - Ваш купон доставлен!',
  },
}

module.exports = createCoreController('api::promotion.promotion', ({ strapi }) => ({
  async requestCoupon(ctx) {
    const { locale } = ctx.request.query
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
        templateId: 'd-c096941312084bdea8775e617e70e6b2',
        dynamicTemplateData: {
          ...TEMPLATE_DATA[locale],
          link: `https://${ctx.request.host}/${locale ?? 'en'}/coupons/${coupon.id}`,
        },
      })

      return coupon.id
    } catch (err) {
      strapi.log.error(err)
      ctx.badRequest()
    }
  },
}))
