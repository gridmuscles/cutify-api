'use strict'

const axios = require('axios')

/**
 * sms service
 */

module.exports = {
  async sendSMS({ phoneNumbers, body }) {
    try {
      const {
        enabled,
        config: { providerOptions },
      } = strapi.config.get('server.sms')

      if (!enabled) {
        throw new Error('SMS service is disabled')
      }

      const authToken = providerOptions.authToken

      if (!authToken) {
        throw new Error('No required data for the sms service')
      }

      const [{ data }] = await Promise.all(
        phoneNumbers.map((phoneNumber) => {
          return axios.post(
            `https://api.smsapi.pl/sms.do`,
            {
              from: 'Cappybara',
              to: phoneNumber,
              message: body,
              encoding: 'utf-8',
            },
            {
              headers: {
                Authorization: `Bearer ${authToken}`,
              },
            }
          )
        })
      )

      if (!data.startsWith('OK:')) {
        throw new Error()
      }

      strapi.log.info(
        `
        SMS is successfully sent for the following numbers
        ${phoneNumbers.join(', ')}
        `
      )
    } catch (err) {
      strapi.log.error(err)
      return err
    }
  },
}
