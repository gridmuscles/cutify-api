'use strict'

/**
 * chat controller
 */

const { createCoreController } = require('@strapi/strapi').factories

module.exports = createCoreController('api::chat.chat', () => ({
  async markAsRead(ctx) {
    try {
      const ifChatOwner = await strapi
        .service('api::chat.chat')
        .ifChatOwner(ctx)

      if (!ifChatOwner) {
        throw new Error()
      }

      return strapi.service('api::chat.chat').markAsRead(ctx)
    } catch (err) {
      strapi.log.error(err)
      ctx.badRequest()
    }
  },
}))
