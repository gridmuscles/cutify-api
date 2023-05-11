const { ERROR_CODES } = require('../../src/utils/const')

const mockChatData = (data = {}) => {
  return {
    messages: [],
    ...data,
  }
}

const createChat = async (data = {}) => {
  if (!data.users) {
    throw new Error(ERROR_CODES.NO_REQUIRED_DYNAMIC_DATA)
  }

  return strapi.db.query('api::chat.chat').create({
    data: {
      ...mockChatData(data),
    },
  })
}

const getChatById = async (chatId) => {
  if (!chatId) {
    throw new Error(ERROR_CODES.NO_REQUIRED_DYNAMIC_DATA)
  }

  return strapi.db.query('api::chat.chat').findOne({
    select: '*',
    where: { id: chatId },
    populate: { messages: true },
  })
}

const clearChats = () => {
  return strapi.db.query('api::chat.chat').deleteMany()
}

module.exports = {
  createChat,
  getChatById,
  clearChats,
}
