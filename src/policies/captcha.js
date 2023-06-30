const axios = require('axios')

module.exports = async (ctx, config) => {
  try {
    const { enabled, id, apiKey, key } = strapi.config.get('server.captcha')
    const token = ctx.request.headers['captcha-token']

    if (!enabled) {
      return true
    }

    const { data } = await axios.post(
      `https://recaptchaenterprise.googleapis.com/v1/projects/${id}/assessments?key=${apiKey}`,
      {
        event: {
          token: token,
          siteKey: key,
          expectedAction: config.action,
        },
      }
    )

    return data.tokenProperties.valid
  } catch (err) {
    strapi.log.error(err.message)
    ctx.badRequest(err.message, err.details)
  }
}
