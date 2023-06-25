module.exports = {
  beforeCreate: async ({ params }) => {
    const prefix = strapi.config.get('server.phone.prefix')
    if (params.data.pin && params.data.originalPhone) {
      params.data.phone = `${prefix}${params.data.pin}`
    }
  },

  beforeUpdate: async ({ params }) => {
    const prefix = strapi.config.get('server.phone.prefix')
    if (params.data.pin && params.data.originalPhone) {
      params.data.phone = `${prefix}${params.data.pin}`
    }
  },
}
