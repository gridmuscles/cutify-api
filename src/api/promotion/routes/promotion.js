'use strict'

/**
 * promotion router
 */

const { createCoreRouter } = require('@strapi/strapi').factories

module.exports = createCoreRouter('api::promotion.promotion', {
  config: {
    find: {
      middlewares: [
        { name: 'global::locale' },
        { name: 'global::search' },
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
