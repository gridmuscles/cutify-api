'use strict'

/**
 * reservation-service controller
 */

const { createCoreController } = require('@strapi/strapi').factories

module.exports = createCoreController(
  'api::reservation-service.reservation-service',
  () => ({
    async create(ctx) {
      return super.create(ctx)
    },
  })
)
