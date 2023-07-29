'use strict'

/**
 * chat controller
 */

const { createCoreController } = require('@strapi/strapi').factories

module.exports = createCoreController('api::chat.chat', () => ({
  async markAsRead(ctx) {
    try {
      const { transformResponse: transformMessageResponse } =
        await strapi.controller('api::message.message')

      const sanitizedQueryParams = await this.sanitizeQuery(ctx)
      ctx.request.query = sanitizedQueryParams

      const ifChatOwner = await strapi
        .service('api::chat.chat')
        .ifChatOwner({ chatId: ctx.params.id, userId: ctx.state.user.id })

      if (!ifChatOwner) {
        throw new Error()
      }

      const message = await strapi.service('api::chat.chat').markAsRead(ctx)
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

  async createLocationPromotionChat(ctx) {
    try {
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

      const transformedChat = await this.transformResponse(newChat)

      const userSocket = strapi.io.socketMap?.get(ctx.state.user.id)
      userSocket?.join(`chat:${newChat.id}`)
      userSocket
        ?.to(`chat:${newChat.id}`)
        .emit('receiveChatSuccess', transformedChat)

      try {
        await strapi.plugins['email'].services.email.send({
          to: location.managers.map(({ email }) => email),
          subject: 'You have new chat!',
          html: 'Cappybara.com - There is a new chat created, please take a look!',
        })
      } catch (err) {
        strapi.log.error('SMS notification about the new chat was not sent')
      }

      return transformedChat
    } catch (err) {
      strapi.log.error(err)
      ctx.badRequest()
    }
  },

  async findUserMeChats(ctx) {
    try {
      const sanitizedQuery = this.sanitizeQuery(ctx)

      const { results, pagination } = await strapi
        .service('api::chat.chat')
        .findByUser({
          userId: ctx.state.user.id,
          query: {
            ...sanitizedQuery,
            populate: {
              promotion: true,
              messages: {
                sort: ['createdAt:asc'],
                populate: {
                  user: {
                    fields: ['id', 'name'],
                  },
                },
              },
              users: {
                fields: ['id', 'name'],
              },
            },
          },
        })

      return this.transformResponse(results, { pagination })
    } catch (err) {
      strapi.log.error(err)
      ctx.badRequest()
    }
  },
}))
