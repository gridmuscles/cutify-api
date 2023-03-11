'use strict'

/**
 * coupon router
 */

const { createCoreRouter } = require('@strapi/strapi').factories

module.exports = createCoreRouter('api::coupon.coupon', {
  config: {
    find: {
      middlewares: [{ name: 'global::i18n' }],
    },
    findOne: {
      middlewares: [{ name: 'global::i18n' }],
    },
  },
})
