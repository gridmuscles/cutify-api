'use strict'

/**
 * article-category router
 */

const { createCoreRouter } = require('@strapi/strapi').factories

module.exports = createCoreRouter('api::article-category.article-category', {
  config: {
    find: {
      middlewares: [{ name: 'global::locale' }, { name: 'global::i18n' }],
      policies: [
        { name: 'global::query', config: { allowedParams: ['locale'] } },
      ],
    },
    findOne: {
      middlewares: [{ name: 'global::locale' }, { name: 'global::i18n' }],
      policies: [
        { name: 'global::query', config: { allowedParams: ['locale'] } },
      ],
    },
  },
})
