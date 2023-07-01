'use strict'

/**
 * chat controller
 */

const { createCoreController } = require('@strapi/strapi').factories

module.exports = createCoreController('api::chat.chat', () => ({
  async markAsRead(ctx) {
    try {
      const { transformResponse } = await strapi.controller(
        'api::message.message'
      )

      const sanitizedQueryParams = await this.sanitizeQuery(ctx)
      ctx.request.query = sanitizedQueryParams

      const ifChatOwner = await strapi
        .service('api::chat.chat')
        .ifChatOwner({ chatId: ctx.params.id, userId: ctx.state.user.id })

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

  async createLocationPromotionChat(ctx) {
    try {
      const { transformResponse: transformChatResponse } =
        await strapi.controller('api::chat.chat')

      const { locationId, promotionId } = ctx.params

      const promotion = await strapi.entityService.findOne(
        'api::promotion.promotion',
        promotionId,
        {
          populate: ['organization'],
        }
      )

      const location = await strapi.entityService.findOne(
        'api::location.location',
        locationId,
        { populate: ['managers', 'organization'] }
      )

      if (
        !location.organization ||
        !promotion.organization ||
        location.organization.id !== promotion.organization.id ||
        promotion.publishedAt === null ||
        !location.isChatAvailable
      ) {
        throw new Error()
      }

      const { results } = await strapi.service('api::chat.chat').find({
        filters: {
          location: location.id,
          promotion: promotion.id,
          users: {
            id: ctx.state.user.id,
          },
        },
        populate: '*',
      })

      if (results.length > 0) {
        throw new Error()
      }

      const newChat = await strapi.service('api::chat.chat').create({
        data: {
          location: location.id,
          promotion: promotion.id,
          users: [ctx.state.user.id],
        },
        populate: {
          location: true,
          promotion: true,
          messages: true,
          users: {
            fields: ['id, name'],
          },
        },
      })

      for (let manager of location.managers) {
        const socket = strapi.io.socketMap?.get(manager.id)
        if (socket) {
          socket.join(`chat:${newChat.id}`)
        }
      }

      const userSocket = strapi.io.socketMap?.get(ctx.state.user.id)
      userSocket?.join(`chat:${newChat.id}`)
      userSocket
        ?.to(`chat:${newChat.id}`)
        .emit('receiveChatSuccess', transformChatResponse(newChat))

      try {
        await strapi.services['api::sms.sms'].sendSMS({
          phoneNumbers: location.managers.map(({ phone }) => phone),
          body: 'Cappybara.com - There is a new chat created, please take a look!',
        })
      } catch (err) {
        strapi.log.error('SMS notification about the new chat was not sent')
      }

      return transformChatResponse(newChat)
    } catch (err) {
      strapi.log.error(err)
      ctx.badRequest()
    }
  },
}))
