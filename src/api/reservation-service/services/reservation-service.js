'use strict'

/**
 * reservation-service service
 */

const { createCoreService } = require('@strapi/strapi').factories

module.exports = createCoreService(
  'api::reservation-service.reservation-service'
)
