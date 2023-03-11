'use strict'

/**
 * category router
 */

const { createCoreRouter } = require('@strapi/strapi').factories

module.exports = createCoreRouter('api::category.category', {
  config: {
    find: {
      middlewares: [{ name: 'global::i18n' }],
    },
  },
})
