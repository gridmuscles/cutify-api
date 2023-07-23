'use strict'

/**
 * article router
 */

const { createCoreRouter } = require('@strapi/strapi').factories

module.exports = createCoreRouter('api::article.article', {
  config: {
    find: {
      middlewares: [
        { name: 'global::locale' },
        { name: 'api::article.is-not-pages' },
        { name: 'global::i18n' },
      ],
      policies: [
        {
          name: 'global::query',
          config: {
            allowedParams: [
              'filters',
              'sort',
              'pagination',
              'populate',
              'locale',
              'publicationState',
            ],
          },
        },
      ],
    },
    findOne: {
      middlewares: [{ name: 'global::locale' }, { name: 'global::i18n' }],
      policies: [
        {
          name: 'global::query',
          config: { allowedParams: ['locale', 'populate'] },
        },
      ],
    },
  },
})
