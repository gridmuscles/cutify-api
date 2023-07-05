'use strict'

/**
 * report router
 */

const { createCoreRouter } = require('@strapi/strapi').factories

module.exports = createCoreRouter('api::report.report', {
  config: {
    find: {
      policies: [{ name: 'global::captcha', config: { action: 'REPORT' } }],
    },
  },
})
