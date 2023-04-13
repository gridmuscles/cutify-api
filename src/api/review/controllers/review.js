'use strict'

const { ERROR_CODES } = require('../../../utils/const')

/**
 * review controller
 */

const { createCoreController } = require('@strapi/strapi').factories

module.exports = createCoreController('api::review.review', () => ({
  async find(ctx) {
    if (!ctx.request.query.filters?.organization?.id?.$eq) {
      throw new Error(ERROR_CODES.REQUIRED_FIELDS_MISSING)
    }

    return super.find(ctx)
  },
}))
