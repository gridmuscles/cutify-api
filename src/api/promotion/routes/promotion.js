'use strict'

/**
 * promotion router
 */

const { createCoreRouter } = require('@strapi/strapi').factories

module.exports = createCoreRouter('api::promotion.promotion', {
  config: {
    find: {
      middlewares: [
        { name: 'global::locale' },
        { name: 'global::search' },
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
              'fields',
              'search',
            ],
          },
        },
      ],
    },
    findOne: {
      middlewares: [{ name: 'global::locale' }, { name: 'global::i18n' }],
      policies: [
        { name: 'global::query', config: { allowedParams: ['populate'] } },
      ],
    },
  },
})
