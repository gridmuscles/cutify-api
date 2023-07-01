'use strict'

/**
 * auction service
 */

const { createCoreService } = require('@strapi/strapi').factories

module.exports = createCoreService('api::auction.auction')
