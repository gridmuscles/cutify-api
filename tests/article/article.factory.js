const mockArticleData = (data = {}) => {
  return {
    title: 'Pizza Mondays',
    title_pl: 'Poniedziałki Pizzy',
    title_ua: 'Понеділки Піци',
    title_ru: 'Понедельник Пиццы',
    description: 'Pizza Mondays',
    description_pl: 'Poniedziałki Pizzy',
    description_ua: 'Понеділки Піци',
    description_ru: 'Понедельник Пиццы',
    isPage: false,
    publishedAt: '2023-01-01 23:59:59',
    categories: [],
    ...data,
  }
}

const createArticle = async (data = {}) => {
  const seoComponent = await strapi.query('shared.seo').create({
    data: data.seo ?? {},
  })

  return strapi.db.query('api::article.article').create({
    data: {
      ...mockArticleData(data),
      seo: seoComponent.id,
    },
  })
}

const clearArticles = () => {
  return strapi.db.query('api::article.article').deleteMany()
}

module.exports = {
  createArticle,
  clearArticles,
}
