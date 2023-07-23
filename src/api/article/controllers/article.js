'use strict'

/**
 * article controller
 */

const { createCoreController } = require('@strapi/strapi').factories

module.exports = createCoreController('api::article.article', ({ strapi }) => ({
  async findBySlug(ctx) {
    try {
      const query = await this.sanitizeQuery(ctx)

      const article = await strapi
        .service('api::article.article')
        .findOneBySlug({ slug: ctx.params.slug, query })

      if (!article) {
        return ctx.notFound()
      }

      const sanitizedResult = await this.sanitizeOutput(article, ctx)
      return this.transformResponse(sanitizedResult)
    } catch (err) {
      strapi.log.error(err)
      ctx.badRequest()
    }
  },
}))
