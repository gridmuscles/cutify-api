const qs = require('qs')

const TEMPLATE_DATA = {
  en: {
    title: 'Your coupon has been activated!',
    greetings: 'Hello!',
    description: 'To use your coupon, click on the "Open Coupon" button below.',
    linkText: 'Open Coupon',
    subject: 'Your Coupon Delivered!',
  },
  pl: {
    title: 'Twój kupon został aktywowany!',
    greetings: 'Witaj!',
    description:
      'Aby skorzystać z kuponu, kliknij przycisk "Otwórz kupon" poniżej.',
    linkText: 'Otwórz kupon',
    subject: 'Twój kupon dostarczony!',
  },
  ua: {
    title: 'Ваш купон активовано!',
    greetings: 'Вітаємо!',
    description:
      'Щоб скористатись купоном, натисніть на кнопку "Відкрити купон" нижче.',
    linkText: 'Відкрити купон',
    subject: 'Ваш купон доставлено!',
  },
  ru: {
    title: 'Ваш купон активирован!',
    greetings: 'Здравствуйте!',
    description:
      'Чтобы воспользоваться купоном, нажмите на кнопку "Открыть купон"',
    linkText: 'Открыть купон',
    subject: 'Ваш купон доставлен!',
  },
}

const getCouponListEmail = ({ email, locale, origin, couponUUIDList }) => {
  const query = qs.stringify(
    {
      filters: {
        uuid: {
          $in: couponUUIDList,
        },
      },
    },
    {
      encodeValuesOnly: true,
    }
  )

  return {
    to: email,
    templateId: 'd-c096941312084bdea8775e617e70e6b2',
    dynamicTemplateData: {
      ...TEMPLATE_DATA[locale],
      link: `${origin}/${locale ?? 'en'}/coupons?${query}`,
    },
  }
}

module.exports = {
  getCouponListEmail,
}
