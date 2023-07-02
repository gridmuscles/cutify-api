'use strict'

/**
 * review router
 */

const { createCoreRouter } = require('@strapi/strapi').factories

module.exports = createCoreRouter('api::review.review', {
  config: {
    create: {
      policies: [
        { name: 'global::captcha', config: { action: 'REVIEW_CREATE' } },
        { name: 'global::query', config: { allowedParams: ['locale'] } },
      ],
    },
  },
})
