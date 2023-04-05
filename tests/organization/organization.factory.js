const mockOrganizationData = (data = {}) => {
  const slugSuffix = Math.round(Math.random() * 10000).toString()
  return {
    title: 'Pizza World',
    slug: `pizza-world-${slugSuffix}`,
    description: 'A chain of Italian pizza restaurants.',
    description_pl: 'Sieć włoskich pizzerii.',
    description_ua: 'Мережа італійських піцерій.',
    description_ru: 'Сеть итальянских пиццерий.',
    siteLink: 'https://www.pizzaworld.com',
    telegramLink: 'https://t.me/pizzaworld',
    facebookLink: 'https://www.facebook.com/pizzaworld',
    instagramLink: 'https://www.instagram.com/pizzaworld',
    googleMapLink: 'https://maps.google.com/pizzaworld',

    managers: [],
    locations: [],

    ...data,
  }
}

const createOrganization = async (data = {}) => {
  if (!data.categories) {
    throw new Error(ERROR_CODES.NO_REQUIRED_DYNAMIC_DATA)
  }

  return strapi.db.query('api::organization.organization').create({
    data: {
      ...mockOrganizationData(data),
    },
  })
}

module.exports = {
  createOrganization,
}
