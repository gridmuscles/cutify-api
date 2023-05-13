'use strict'

/**
 * location controller
 */

const { createCoreController } = require('@strapi/strapi').factories

module.exports = createCoreController('api::location.location', () => ({
  async find(ctx) {
    ctx.badRequest()
  },
  async findOne(ctx) {
    ctx.badRequest()
  },
}))
