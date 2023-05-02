'use strict'

/**
 * chat controller
 */

const { createCoreController } = require('@strapi/strapi').factories

module.exports = createCoreController('api::chat.chat', () => ({
  async markAsRead(ctx) {
    const { transformResponse } = await strapi.controller(
      'api::message.message'
    )

    try {
      const ifChatOwner = await strapi
        .service('api::chat.chat')
        .ifChatOwner(ctx)

      if (!ifChatOwner) {
        throw new Error()
      }

      const message = await strapi.service('api::chat.chat').markAsRead(ctx)

      const userSocket = strapi.io.socketMap?.get(ctx.state.user.id)
      userSocket
        ?.to(`chat:${ctx.params.id}`)
        .emit('receiveChatMessageSuccess', transformResponse(message))

      return transformResponse(message)
    } catch (err) {
      strapi.log.error(err)
      ctx.badRequest()
    }
  },
}))
