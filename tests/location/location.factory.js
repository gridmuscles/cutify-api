const { ERROR_CODES } = require('../../src/utils/const')

const mockLocationData = (data = {}) => {
  const slugSuffix = Math.round(Math.random() * 10000).toString()
  return {
    text: `location-${slugSuffix}`,
    latitude: '',
    longitude: '',
    phone: '234234324',
    isRU: true,
    isPL: true,
    isUA: true,
    isEN: true,
    address: `Address for location-${slugSuffix}`,
    workhours: `en workhours for location-${slugSuffix}`,
    workhours_pl: `pl workhours for location-${slugSuffix}`,
    workhours_ua: `ua workhours for location-${slugSuffix}`,
    workhours_ru: `ru workhours for location-${slugSuffix}`,
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
