module.exports = {
  beforeCreate: async ({ params }) => {
    if (typeof params.data.text === 'string') {
      params.data.text = strapi.encrypt(params.data.text)
    }
  },

  beforeUpdate: async ({ params }) => {
    if (typeof params.data.text === 'string') {
      params.data.text = strapi.encrypt(params.data.text)
    }
  },

  afterFindOne: async ({ result }) => {
    if (typeof result?.text === 'string') {
      result.text = strapi.decrypt(result.text)
    }
  },

  afterFindMany: async ({ result }) => {
    result?.forEach((message) => {
      message.text =
        typeof message.text === 'string'
          ? strapi.decrypt(message.text)
          : message.text
    })
  },
}
