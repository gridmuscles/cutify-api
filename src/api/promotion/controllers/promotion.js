'use strict'

/**
 * promotion controller
 */

const { createCoreController } = require('@strapi/strapi').factories

const TEMPLATE_DATA = {
  en: {
    title: 'Your coupon is activated!',
    greetings: 'Hello!',
    description: 'To use the coupon, click on the "Open coupon" button',
    linkText: 'Open coupon',
  },
  pl: {
    title: 'Twój kupon został aktywowany!',
    greetings: 'Witaj!',
    description: 'Aby skorzystać z kuponu, kliknij przycisk "Otwórz kupon"',
    linkText: 'Otwórz kupon',
  },
  ua: {
    title: 'Ваш купон активовано!',
    greetings: 'Вітаю!',
    description: 'Щоб скористатися купоном, натисніть кнопку "Відкрити купон"',
    linkText: 'Відкрити купон',
  },
  ru: {
    title: 'Ваш купон активирован!',
    greetings: 'Здравствуйте!',
    description: 'Чтобы воспользоваться купоном, нажмите на кнопку "Открыть купон"',
    linkText: 'Открыть купон',
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
