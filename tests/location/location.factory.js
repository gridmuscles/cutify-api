const { ERROR_CODES } = require('../../src/utils/const')

const mockLocationData = (data = {}) => {
  const slugSuffix = Math.round(Math.random() * 10000).toString()
  return {
    text: `location-${slugSuffix}`,
    latitude: '',
    longitude: '',
    phone: null,
    originalPhone: '11111111',
    pin: '2222',
    isRU: true,
    isPL: true,
    isUA: true,
    isEN: true,
    address: `Address for location-${slugSuffix}`,
    details: `en details for location-${slugSuffix}`,
    details_pl: `pl details for location-${slugSuffix}`,
    details_ua: `ua details for location-${slugSuffix}`,
    details_ru: `ru details for location-${slugSuffix}`,
    workhours: `en workhours for location-${slugSuffix}`,
    workhours_pl: `pl workhours for location-${slugSuffix}`,
    workhours_ua: `ua workhours for location-${slugSuffix}`,
    workhours_ru: `ru workhours for location-${slugSuffix}`,
    managers: [],
    messages: [],
    users: [],
    ...data,
  }
}

const createLocation = async (data = {}) => {
  if (!data.city || !data.organization || !data.managers) {
    strapi.log.warn(ERROR_CODES.NO_REQUIRED_DYNAMIC_DATA)
  }

  return strapi.db.query('api::location.location').create({
    data: {
      ...mockLocationData(data),
    },
  })
}

module.exports = {
  createLocation,
}
