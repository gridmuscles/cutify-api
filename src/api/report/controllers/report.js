'use strict'

/**
 * report controller
 */

const { createCoreController } = require('@strapi/strapi').factories

module.exports = createCoreController('api::report.report', () => ({
  async create(ctx) {
    ctx.request.body.data.locale = ctx.request.query.locale
    return super.create(ctx)
  },
}))
