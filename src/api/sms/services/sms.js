'use strict'

/**
 * sms service
 */

module.exports = {
  async sendSMS({ phoneNumbers, body }) {
    try {
      const {
        enabled,
        config: { providerOptions, settings },
      } = strapi.config.get('server.sms')

      if (!enabled) {
        throw new Error('SMS service is disabled')
      }

      const accountSid = providerOptions.accountSid
      const authToken = providerOptions.authToken
      const senderPhoneNumber = settings.senderPhoneNumber

      const client = require('twilio')(accountSid, authToken)

      if (!accountSid || !authToken || !senderPhoneNumber) {
        throw new Error('No required data for the sms service')
      }

      await Promise.all(
        phoneNumbers.map((phoneNumber) => {
          return client.messages.create({
            body,
            from: senderPhoneNumber,
            to: phoneNumber,
          })
        })
      )
    } catch (err) {
      strapi.log.error(err)
      return err
    }
  },
}
