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

  async createMessage(ctx) {
    try {
      const { transformResponse: transformMessageResponse } =
        await strapi.controller('api::message.message')

      const {
        results: [chat],
      } = await strapi.service('api::chat.chat').find({
        filters: {
          id: ctx.params.id,
          $or: [
            {
              users: {
                id: ctx.state.user.id,
              },
            },
            {
              promotion: {
                organization: {
                  managers: {
                    id: ctx.state.user.id,
                  },
                },
              },
            },
          ],
        },
        populate: {
          promotion: true,
        },
      })

      if (!chat || (chat.promotion && !chat.promotion.isChatAvailable)) {
        throw new Error()
      }

      const message = await strapi.service('api::message.message').create({
        data: {
          text: ctx.request.body.data.text,
          user: ctx.state.user.id,
          chat: ctx.params.id,
        },
        populate: {
          chat: {
            fields: ['id'],
          },
          user: {
            fields: ['id, name'],
          },
        },
      })

      const transformedMessage = await transformMessageResponse(message)

      const userSocket = strapi.io.socketMap?.get(ctx.state.user.id)
      userSocket
        ?.to(`chat:${ctx.params.id}`)
        .emit('receiveChatMessageSuccess', transformedMessage)

      return transformedMessage
    } catch (err) {
      strapi.log.error(err)
      ctx.badRequest()
    }
  },
}))
