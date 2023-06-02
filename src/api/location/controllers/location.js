'use strict'

/**
 * location controller
 */

const { createCoreController } = require('@strapi/strapi').factories

module.exports = createCoreController('api::location.location', () => ({
  async find(ctx) {
    ctx.badRequest()
  },
  async findOne(ctx) {
    ctx.badRequest()
  },

  async createLocationChat(ctx) {
    try {
      const { transformResponse: transformChatResponse } =
        await strapi.controller('api::chat.chat')

      const location = await strapi.entityService.findOne(
        'api::location.location',
        ctx.params.id,
        { populate: ['managers'] }
      )

      if (!location.isChatAvailable) {
        throw new Error()
      }

      const { results } = await strapi.service('api::chat.chat').find({
        filters: {
          location: location.id,
          users: {
            id: ctx.state.user.id,
          },
        },
        populate: '*',
      })

      console.log(results)

      if (results.length > 0) {
        throw new Error()
      }

      const newChat = await strapi.service('api::chat.chat').create({
        data: {
          location: location.id,
          users: [ctx.state.user.id],
        },
        populate: {
          location: true,
          messages: true,
          users: {
            fields: ['id, name'],
          },
        },
      })

      console.log(6)

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
