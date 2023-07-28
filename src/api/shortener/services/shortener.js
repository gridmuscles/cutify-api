'use strict'

const axios = require('axios')

/**
 * sms service
 */

module.exports = {
  async getShortUrl({ url }) {
    try {
      const {
        config: { providerOptions },
      } = strapi.config.get('server.shortener')

      const authToken = providerOptions.authToken

      if (!authToken) {
        throw new Error('No required data for the sms service')
      }

      const { data } = await axios.post(
        `https://api.tinyurl.com/create/`,
        {
          url,
        },
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      )

      return data.data.tiny_url
    } catch (err) {
      strapi.log.error(err)
    }
  },
}
