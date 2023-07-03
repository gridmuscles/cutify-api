'use strict'

/**
 * coupon router
 */

const { createCoreRouter } = require('@strapi/strapi').factories

module.exports = createCoreRouter('api::coupon.coupon', {
  config: {
    find: {
      middlewares: [{ name: 'global::locale' }, { name: 'global::i18n' }],
      policies: [
        {
          name: 'global::query',
          config: { allowedParams: ['filters', 'populate'] },
        },
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
