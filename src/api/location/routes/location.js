'use strict'

/**
 * location router
 */

const { createCoreRouter } = require('@strapi/strapi').factories

module.exports = createCoreRouter('api::location.location', {
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
