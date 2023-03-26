const { ERROR_CODES } = require('../utils/const')

const mockReservationServiceData = (data = {}) => {
  return {
    title: 'Awesome Product',
    title_pl: 'Niesamowity Produkt',
    title_ua: 'Чудовий продукт',
    title_ru: 'Классный продукт',
    description: 'This is a great product that will make your life easier.',
    description_pl: 'To jest wspaniały produkt, który ułatwi Ci życie.',
    description_ru: 'Это отличный продукт, который сделает вашу жизнь проще.',
    description_ua: 'Це чудовий продукт, який зробить ваше життя легшим.',
    durationMinutes: 60,
    price: 29.99,
    ...data,
  }
}

const createReservationService = async (data = {}) => {
  if (!data.organization || !data.targets) {
    throw new Error(ERROR_CODES.NO_REQUIRED_DYNAMIC_DATA)
  }

  return strapi.db
    .query('api::reservation-service.reservation-service')
    .create({
      data: {
        organization: data.organization,
        targets: data.targets,
        ...mockReservationServiceData(data),
      },
    })
}

module.exports = {
  createReservationService,
}
