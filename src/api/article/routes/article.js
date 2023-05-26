'use strict'

/**
 * article router
 */

const { createCoreRouter } = require('@strapi/strapi').factories

module.exports = createCoreRouter('api::article.article', {
  config: {
    findOne: {
      middlewares: [{ name: 'global::locale' }, { name: 'global::i18n' }],
    },
  },
})
