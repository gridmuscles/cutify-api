'use strict'

/**
 * static-pages controller
 */

const { createCoreController } = require('@strapi/strapi').factories

module.exports = createCoreController('api::static-pages.static-pages', () => ({
  async findOne(ctx) {
    try {
      const slug = ctx.params.slug
      const result = await strapi.entityService.findMany(
        'api::static-pages.static-pages',
        {
          populate: {
            [slug]: true,
          },
        }
      )

      if (!result) {
        throw new Error()
      }

      const { id, ...attributes } = result
      const { id: articleId, ...articleAttribues } = attributes[slug]

      if (!articleId || articleAttribues.publishedAt === null) {
        throw new Error()
      }

      return {
        data: {
          id,
          attributes: {
            ...attributes,
            [slug]: {
              data: {
                id: articleId,
                attributes: articleAttribues,
              },
            },
          },
        },
      }
    } catch (err) {
      strapi.log.error(err)
      ctx.badRequest()
    }
  },
}))
