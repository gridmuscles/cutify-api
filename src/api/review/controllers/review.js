'use strict'

/**
 * review controller
 */

const { createCoreController } = require('@strapi/strapi').factories

module.exports = createCoreController('api::review.review', () => ({
  async findOrganizationReviews(ctx) {
    try {
      /* eslint-disable no-unused-vars */
      const { locale, filters, ...query } = await this.sanitizeQuery(ctx)

      const { results: reviews, pagination } = await strapi
        .service('api::review.review')
        .find({
          filters: {
            organization: ctx.params.organizationId,
            ...filters,
          },
          ...query,
        })

      const sanitizedResults = await this.sanitizeOutput(reviews, ctx)
      return this.transformResponse(sanitizedResults, { pagination })
    } catch (err) {
      strapi.log.error(err)
      ctx.badRequest(err.message, err.details)
    }
  },
}))
