'use strict'

/**
 * message service
 */

const { createCoreService } = require('@strapi/strapi').factories

module.exports = createCoreService('api::message.message', () => ({
  async createChatMessage({ chatId, userId, text }) {
    return strapi.service('api::message.message').create({
      data: {
        text,
        user: userId,
        chat: chatId,
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
  },
}))
