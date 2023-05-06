'use strict'

/**
 * organization controller
 */

const { createCoreController } = require('@strapi/strapi').factories

module.exports = createCoreController('api::organization.organization', () => ({
  async findReviews(ctx) {
    try {
      const {
        transformResponse: transformReviewResponse,
        sanitizeOutput: sanitizeReviewOutput,
      } = await strapi.controller('api::review.review')
      const sanitizedQueryParams = await this.sanitizeQuery(ctx)

      const { results: reviews, pagination } = await strapi
        .service('api::review.review')
        .find({
          filters: {
            organization: ctx.params.id,
          },
          ...sanitizedQueryParams,
        })

      const sanitizedResults = await sanitizeReviewOutput(reviews, ctx)
      return transformReviewResponse(sanitizedResults, { pagination })
    } catch (err) {
      strapi.log.error(err)
      ctx.badRequest(err.message, err.details)
    }
  },
}))
