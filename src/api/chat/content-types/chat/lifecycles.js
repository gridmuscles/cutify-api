module.exports = {
  afterFindOne: async ({ result }) => {
    if (!Array.isArray(result.messages)) {
      return
    }

    result.messages?.forEach((message) => {
      message.text =
        typeof message.text === 'string'
          ? strapi.decrypt(message.text)
          : message.text
    })
  },

  afterFindMany: async ({ result }) => {
    result.forEach((chat) => {
      if (!Array.isArray(chat.messages)) {
        return
      }

      chat.messages?.forEach((message) => {
        message.text =
          typeof message.text === 'string'
            ? strapi.decrypt(message.text)
            : message.text
      })
    })
  },
}
