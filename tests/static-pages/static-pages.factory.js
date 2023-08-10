const mockStaticPagesData = (data = {}) => {
  return {
    privacy: null,
    about: null,
    help: null,
    support: null,
    contacts: null,
    howitworks: null,
    main: null,
    publishedAt: '2023-01-01 23:59:59',
    ...data,
  }
}

const createStaticPages = async (data = {}) => {
  return strapi.db.query('api::static-pages.static-pages').create({
    data: {
      ...mockStaticPagesData(data),
    },
  })
}

const clearStaticPages = () => {
  return strapi.db.query('api::static-pages.static-pages').deleteMany()
}

module.exports = {
  createStaticPages,
  clearStaticPages,
}
