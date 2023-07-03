'use strict'

/**
 * organization router
 */

const { createCoreRouter } = require('@strapi/strapi').factories

module.exports = createCoreRouter('api::organization.organization', {
  config: {
    find: {
      middlewares: [{ name: 'global::locale' }, { name: 'global::i18n' }],
      policies: [
        { name: 'global::query', config: { allowedParams: ['populate'] } },
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
