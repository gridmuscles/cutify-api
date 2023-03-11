'use strict'

/**
 * promotion router
 */

const { createCoreRouter } = require('@strapi/strapi').factories

module.exports = createCoreRouter('api::promotion.promotion', {
  config: {
    find: {
      middlewares: [{ name: 'global::i18n' }],
    },
    findOne: {
      middlewares: [{ name: 'global::i18n' }],
    },
  },
})
