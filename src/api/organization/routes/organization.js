'use strict'

/**
 * organization router
 */

const { createCoreRouter } = require('@strapi/strapi').factories

module.exports = createCoreRouter('api::organization.organization', {
  config: {
    find: {
      middlewares: [
        { name: 'global::locale' },
        { name: 'global::i18n' },
        { name: 'global::populate', config: { deep: 2 } },
      ],
    },
    findOne: {
      middlewares: [
        { name: 'global::locale' },
        { name: 'global::i18n' },
        { name: 'global::populate', config: { deep: 2 } },
      ],
    },
  },
})
