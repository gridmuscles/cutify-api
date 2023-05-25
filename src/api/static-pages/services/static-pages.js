'use strict'

/**
 * static-pages service
 */

const { createCoreService } = require('@strapi/strapi').factories

module.exports = createCoreService('api::static-pages.static-pages')
