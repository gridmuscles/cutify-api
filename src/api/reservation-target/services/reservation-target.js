'use strict'

/**
 * reservation-target service
 */

const { createCoreService } = require('@strapi/strapi').factories

module.exports = createCoreService('api::reservation-target.reservation-target')
