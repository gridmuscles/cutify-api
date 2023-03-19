'use strict'

/**
 * reservation controller
 */

const { createCoreController } = require('@strapi/strapi').factories

module.exports = createCoreController('api::reservation.reservation', () => ({
  async create(ctx) {
    return super.create(ctx)
  },
}))
