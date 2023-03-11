'use strict'

/**
 * organization router
 */

const { createCoreRouter } = require('@strapi/strapi').factories

module.exports = createCoreRouter('api::organization.organization', {
  config: {
    find: {
      middlewares: [{ name: 'global::i18n' }],
    },
  },
})
