'use strict'

/**
 * category router
 */

const { createCoreRouter } = require('@strapi/strapi').factories

module.exports = createCoreRouter('api::category.category', {
  config: {
    find: {
      middlewares: [{ name: 'global::locale' }, { name: 'global::i18n' }],
      policies: [
        {
          name: 'global::query',
          config: {
            allowedParams: [
              'fields',
              'locale',
              'pagination',
              'filters',
              'populate',
              'sort',
            ],
          },
        },
      ],
    },
  },
})
