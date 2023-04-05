'use strict'

/**
 * reservation-service router
 */

const { createCoreRouter } = require('@strapi/strapi').factories

module.exports = createCoreRouter(
  'api::reservation-service.reservation-service'
)
