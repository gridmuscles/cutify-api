const qs = require('qs')

const TEMPLATE_DATA = {
  en: ({ title, couponsAmount }) => ({
    subject: `Your coupons (${couponsAmount} pcs.) for the promotion ${title} have been activated!`,
    greetings: 'Hello!',
    description: "To use the coupons, click the 'Open Coupons' button",
    linkText: 'Open Coupons',
    title: 'Your coupons have been delivered!',
  }),
  pl: ({ title, couponsAmount }) => ({
    subject: `Twoje kupony (${couponsAmount} szt.) dla promocji ${title} zostały aktywowane!`,
    greetings: 'Witaj!',
    description: "Aby skorzystać z kuponów, kliknij przycisk 'Otwórz kupony'",
    linkText: 'Otwórz kupony',
    title: 'Twoje kupony zostały dostarczone!',
  }),
  ua: ({ title, couponsAmount }) => ({
    subject: `Ваші купони (${couponsAmount} шт.) для акції ${title} активовані!`,
    greetings: 'Вітаємо!',
    description:
      "Щоб скористатися купонами, натисніть кнопку 'Відкрити купони'",
    linkText: 'Відкрити купони',
    title: 'Ваші купони доставлені!',
  }),
  ru: ({ title, couponsAmount }) => ({
    subject: `Ваши купоны (${couponsAmount} шт.) для акции ${title} активированы!`,
    greetings: 'Здравствуйте!',
    description:
      'Чтобы воспользоваться купонами, нажмите на кнопку "Открыть купоны"',
    linkText: 'Открыть купоны',
    title: 'Ваши купоны доставлены!',
  }),
}

const getCouponListEmail = ({
  title,
  email,
  locale,
  origin,
  promotionId,
  couponUUIDList,
}) => {
  const filters = qs.stringify(
    {
      filters: {
        promotion: {
          id: promotionId,
        },
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
      ...TEMPLATE_DATA[locale ?? 'en']({
        title,
        couponsAmount: couponUUIDList.length,
      }),
      link: `${origin}/${locale ?? 'en'}/coupons/?${filters}`,
    },
  }
}

module.exports = {
  getCouponListEmail,
}
