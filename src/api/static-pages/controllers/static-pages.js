'use strict'

/**
 * static-pages controller
 */

const { createCoreController } = require('@strapi/strapi').factories

module.exports = createCoreController('api::static-pages.static-pages', () => ({
  async find(ctx) {
    ctx.request.query = {
      populate: true,
    }

    const { id, ...attributes } = await strapi.entityService.findMany(
      'api::static-pages.static-pages',
      {
        fields: [],
        populate: {
          privacy: {
            fields: ['id'],
          },
          about: {
            fields: ['id'],
          },
          help: {
            fields: ['id'],
          },
          support: {
            fields: ['id'],
          },
          contacts: {
            fields: ['id'],
          },
          howitworks: {
            fields: ['id'],
          },
        },
      }
    )

    return { data: { id, attributes } }
  },
}))
