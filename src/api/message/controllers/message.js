'use strict'

/**
 * message controller
 */

const { createCoreController } = require('@strapi/strapi').factories

module.exports = createCoreController('api::message.message', () => ({
  async createChatMessage(ctx) {
    try {
      const {
        results: [chat],
      } = await strapi.service('api::chat.chat').find({
        filters: {
          id: ctx.params.chatId,
          $or: [
            {
              users: {
                id: ctx.state.user.id,
              },
            },
            {
              location: {
                managers: {
                  id: ctx.state.user.id,
                },
              },
            },
          ],
        },
        populate: ['location.managers'],
      })

      if (!chat || (chat.location && !chat.location.isChatAvailable)) {
        throw new Error()
      }

      const message = await strapi
        .service('api::message.message')
        .createChatMessage({
          chatId: ctx.params.chatId,
          userId: ctx.state.user.id,
          text: ctx.request.body.data.text,
        })

      const transformedMessage = await this.transformResponse(message)

      const userSocket = strapi.io.socketMap?.get(ctx.state.user.id)
      userSocket
        ?.to(`chat:${ctx.params.chatId}`)
        .emit('receiveChatMessageSuccess', transformedMessage)

      return transformedMessage
    } catch (err) {
      strapi.log.error(err)
      ctx.badRequest()
    }
  },
}))
