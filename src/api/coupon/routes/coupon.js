'use strict'

/**
 * coupon router
 */

const { createCoreRouter } = require('@strapi/strapi').factories

module.exports = createCoreRouter('api::coupon.coupon', {
  config: {
    find: {
      middlewares: [
        { name: 'global::locale' },
        { name: 'global::i18n' },
        { name: 'global::populate', config: { deep: 3 } },
      ],
    },
    findOne: {
      middlewares: [
        { name: 'global::locale' },
        { name: 'global::i18n' },
        { name: 'global::populate', config: { deep: 3 } },
      ],
    },
  },
})
