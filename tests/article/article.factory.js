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
    ...data,
  }
}

const createArticle = async (data = {}) => {
  return strapi.db.query('api::article.article').create({
    data: {
      ...mockArticleData(data),
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
