const { ERROR_CODES } = require('../utils/const')

const mockReservationData = (data = {}) => {
  return {
    title: 'Professional Cleaning Service',
    title_pl: 'Profesjonalna usługa sprzątania',
    title_ua: 'Професійна послуга прибирання',
    title_ru: 'Профессиональная услуга уборки',
    description:
      'We offer top-quality cleaning services for your home or office. Our experienced team will leave your space sparkling clean!',
    description_pl:
      'Oferujemy wysokiej jakości usługi sprzątania dla Twojego domu lub biura. Nasz doświadczony zespół pozostawi Twój przestrzeń lśniąco czystą!',
    description_ru:
      'Мы предлагаем высококачественные услуги по уборке для вашего дома или офиса. Наша опытная команда оставит ваше пространство сверкающе чистым!',
    description_ua:
      'Ми пропонуємо високоякісні послуги з прибирання для вашого дому або офісу. Наш досвідчений колектив залишить ваш простір блискуче чистим!',
    ...data,
  }
}

const createReservationTarget = async (data = {}) => {
  if (!data.organization || !data.services) {
    throw new Error(ERROR_CODES.NO_REQUIRED_DYNAMIC_DATA)
  }

  return strapi.db.query('api::reservation-target.reservation-target').create({
    data: {
      organization: data.organization,
      services: data.services,
      ...mockReservationData(data),
    },
  })
}

module.exports = {
  createReservationTarget,
}
