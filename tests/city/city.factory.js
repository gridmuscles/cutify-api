const mockCityData = (data = {}) => {
  const slugSuffix = Math.round(Math.random() * 10000).toString()
  return {
    title: `City${slugSuffix}`,
    slug: `city-${slugSuffix}`,

    ...data,
  }
}

const createCity = async (data = {}) => {
  return strapi.db.query('api::city.city').create({
    data: {
      ...mockCityData(data),
    },
  })
}

module.exports = {
  createCity,
}
