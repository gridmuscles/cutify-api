'use strict'

/**
 * reservation-service controller
 */
const { ValidationError } = require('@strapi/utils').errors
const { createCoreController } = require('@strapi/strapi').factories

const { ERROR_CODES } = require('../../../utils/const')

module.exports = createCoreController(
  'api::reservation-service.reservation-service',
  () => ({
    async find(ctx) {
      const {
        data: { organization },
      } = ctx.request.body

      if (!organization) {
        throw new ValidationError(ERROR_CODES.REQUIRED_FILTERS_ARE_MISSED)
      }

      return super.find(ctx)
    },
  })
)
