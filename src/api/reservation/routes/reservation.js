'use strict'

/**
 * reservation router
 */

const { createCoreRouter } = require('@strapi/strapi').factories

module.exports = createCoreRouter('api::reservation.reservation', {
  config: {
    find: {
      middlewares: [
        { name: 'global::i18n' },
        { name: 'global::populate', config: { deep: 3 } },
      ],
    },
  },
})
