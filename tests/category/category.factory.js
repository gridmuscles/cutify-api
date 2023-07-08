const mockCategoryData = (data = {}) => {
  const slugSuffix = Math.round(Math.random() * 10000).toString()
  return {
    title: 'Italian Pizza Restaurant',
    title_pl: 'Włoska Pizzeria',
    title_ua: 'Італійська піцерія',
    title_ru: 'Итальянская пиццерия',
    description: 'A restaurant that specializes in authentic Italian pizza.',
    description_pl:
      'Restauracja specjalizująca się w autentycznej włoskiej pizzy.',
    description_ua:
      'Ресторан, що спеціалізується на автентичній італійській піці.',
    description_ru:
      'Ресторан, специализирующийся на настоящей итальянской пицце.',
    slug: `italian-pizza-restaurant-${slugSuffix}`,
    children: [],
    paretn: null,
    ...data,
  }
}

const createCategory = async (data = {}) => {
  const seoComponent = await strapi.query('shared.seo').create({
    data: data.seo ?? {},
  })

  return strapi.db.query('api::category.category').create({
    data: {
      ...mockCategoryData(data),
      seo: seoComponent.id,
    },
  })
}

module.exports = {
  createCategory,
}
