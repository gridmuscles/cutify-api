'use strict'

/**
 * article service
 */

const { createCoreService } = require('@strapi/strapi').factories

module.exports = createCoreService('api::article.article', ({ strapi }) => ({
  async findOneBySlug({ slug, query }) {
    const { filters, ...rest } = query

    const results = await strapi.entityService.findMany(
      'api::article.article',
      {
        filters: {
          slug,
          ...filters,
        },
        ...rest,
      }
    )

    return results[0] ?? null
  },
}))
