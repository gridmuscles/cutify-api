'use strict'

/**
 * static-pages router
 */

const { createCoreRouter } = require('@strapi/strapi').factories

module.exports = createCoreRouter('api::static-pages.static-pages', {
  config: {
    find: {
      middlewares: [
        { name: 'global::locale' },
        { name: 'global::populate', config: { deep: 3 } },
      ],
    },
  },
})
