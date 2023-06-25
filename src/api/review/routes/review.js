'use strict'

/**
 * review router
 */

const { createCoreRouter } = require('@strapi/strapi').factories

module.exports = createCoreRouter('api::review.review', {
  config: {
    find: {
      middlewares: [
        { name: 'global::locale' },
        { name: 'global::i18n' },
        { name: 'global::populate', config: { deep: 2 } },
      ],
    },
    create: {
      policies: [
        { name: 'global::captcha', config: { action: 'REVIEW_CREATE' } },
      ],
    },
  },
})
