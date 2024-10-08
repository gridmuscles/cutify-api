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
            fields: ['id', 'name'],
          },
        },
      })
    } catch (err) {
      strapi.log.error(err)
      ctx.badRequest()
    }
  },

  async findByUser({ userId, query }) {
    /* eslint-disable no-unused-vars */
    const { locale, filters, ...rest } = query

    return strapi.service('api::chat.chat').find({
      filters: {
        $or: [
          {
            users: {
              id: userId,
            },
          },
          {
            location: {
              managers: {
                id: userId,
              },
            },
          },
        ],
        ...filters,
      },
      ...rest,
    })
  },

  async ifChatOwner({ chatId, userId }) {
    const chats = await strapi.entityService.findMany('api::chat.chat', {
      filters: {
        id: chatId,
        $or: [
          {
            users: {
              id: userId,
            },
          },
          {
            location: {
              managers: {
                id: userId,
              },
            },
          },
        ],
      },
    })

    return chats.length === 1
  },

  async getUsersToNotificate({ messagesCreatedAtStart }) {
    const chats = await strapi.entityService.findMany('api::chat.chat', {
      filters: {
        messages: {
          text: { $notNull: true },
          createdAt: { $gte: messagesCreatedAtStart },
        },
      },
      populate: {
        location: {
          populate: {
            managers: {
              fields: ['id', 'email', 'phone'],
              populate: {
                role: {
                  fields: ['type'],
                },
              },
            },
          },
        },
        messages: {
          sort: ['createdAt:desc'],
          populate: {
            user: {
              fields: ['id', 'email', 'phone'],
              populate: {
                role: {
                  fields: ['type'],
                },
              },
            },
          },
        },
        users: {
          fields: ['id', 'email', 'phone'],
          populate: {
            role: {
              fields: ['type'],
            },
          },
        },
      },
    })

    let recipients = new Map()

    for (let chat of chats) {
      if (!chat.messages.length) {
        continue
      }

      const chatUsers = new Map()

      for (let user of [...chat.location.managers, ...chat.users]) {
        chatUsers.set(user.id, user)
      }

      let onlyNullMessages = true

      for (const message of chat.messages) {
        if (message.text === null) {
          chatUsers.delete(message.user.id)
        }

        if (message.text !== null) {
          chatUsers.delete(message.user.id)
          onlyNullMessages = false
          break
        }
      }

      if (!onlyNullMessages) {
        recipients = new Map([...recipients, ...chatUsers])
      }
    }

    return [...recipients.values()]
  },
}))
