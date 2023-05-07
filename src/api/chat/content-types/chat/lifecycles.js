module.exports = {
  afterFindOne: async ({ result }) => {
    result.messages?.forEach((message) => {
      message.text =
        typeof message.text === 'string'
          ? strapi.decrypt(message.text)
          : message.text
    })
  },

  afterFindMany: async ({ result }) => {
    result.forEach((chat) => {
      chat.messages?.forEach((message) => {
        message.text =
          typeof message.text === 'string'
            ? strapi.decrypt(message.text)
            : message.text
      })
    })
  },
}
