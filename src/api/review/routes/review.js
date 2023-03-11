'use strict'

/**
 * review router
 */

const { createCoreRouter } = require('@strapi/strapi').factories

module.exports = createCoreRouter('api::review.review', {
  config: {
    find: {
      middlewares: [{ name: 'global::i18n' }],
    },
    findOne: {
      middlewares: [{ name: 'global::i18n' }],
    },
  },
})
