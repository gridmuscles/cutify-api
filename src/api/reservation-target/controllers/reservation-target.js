'use strict'

/**
 * reservation-target controller
 */

const { createCoreController } = require('@strapi/strapi').factories

module.exports = createCoreController(
  'api::reservation-target.reservation-target',
  () => ({
    async create(ctx) {
      return super.create(ctx)
    },
  })
)
