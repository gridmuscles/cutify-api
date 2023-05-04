'use strict'

/**
 * chat service
 */

const { createCoreService } = require('@strapi/strapi').factories

module.exports = createCoreService('api::chat.chat', () => ({
  async markAsRead(ctx) {
    try {
      const message = await strapi.db.query('api::message.message').findOne({
        where: {
          chat: ctx.params.id,
          text: null,
          user: ctx.state.user.id,
        },
      })

      if (!message) {
        const newMessage = await strapi.db
          .query('api::message.message')
          .create({
            data: {
              text: null,
              user: ctx.state.user.id,
              chat: ctx.params.id,
            },
            populate: ['chat.id', 'user.id'],
          })

        newMessage.user = { id: newMessage.user.id }
        return newMessage
      }

      return strapi.service('api::message.message').update(message.id, {
        data: {
          createdAt: new Date(),
        },
        populate: {
          chat: {
            fields: ['id'],
          },
          user: {
            fields: ['id'],
          },
        },
      })
    } catch (err) {
      strapi.log.error(err)
      ctx.badRequest()
    }
  },

  async findByUser(ctx) {
    try {
      return strapi.service('api::chat.chat').find({
        filters: {
          $or: [
            {
              users: {
                id: {
                  $in: [ctx.state.user.id],
                },
              },
            },
            {
              promotion: {
                organization: {
                  managers: {
                    id: {
                      $in: [ctx.state.user.id],
                    },
                  },
                },
              },
            },
          ],
        },
        populate: {
          promotion: true,
          messages: {
            sort: ['createdAt:asc'],
            populate: {
              user: {
                fields: ['id'],
              },
            },
          },
          users: {
            fields: ['id'],
          },
        },
      })
    } catch (err) {
      strapi.log.error(err)
      ctx.badRequest()
    }
  },

  async ifChatOwner(ctx) {
    try {
      const { results: chats } = await strapi.service('api::chat.chat').find({
        filters: {
          id: ctx.params.id,
          $or: [
            {
              users: {
                id: {
                  $in: [ctx.state.user.id],
                },
              },
            },
            {
              promotion: {
                organization: {
                  managers: {
                    id: {
                      $in: [ctx.state.user.id],
                    },
                  },
                },
              },
            },
          ],
        },
      })

      return chats.length === 1
    } catch (err) {
      strapi.log.error(err)
      ctx.badRequest()
    }
  },
}))
