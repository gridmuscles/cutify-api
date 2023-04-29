const { ERROR_CODES } = require('../../src/utils/const')

const mockMessageData = (data = {}) => {
  const slugSuffix = Math.round(Math.random() * 10000).toString()
  return {
    text: `message-${slugSuffix}`,
    ...data,
  }
}

const createMessage = async (data = {}) => {
  if (!data.user) {
    throw new Error(ERROR_CODES.NO_REQUIRED_DYNAMIC_DATA)
  }

  return strapi.db.query('api::message.message').create({
    data: {
      ...mockMessageData(data),
    },
  })
}

const getAllMessages = async () => {
  return strapi.db.query('api::message.message').findMany()
}

module.exports = {
  createMessage,
  getAllMessages,
}
