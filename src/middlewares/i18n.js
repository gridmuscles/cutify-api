const { translateEntity } = require('../utils/translate-entity.js')

module.exports = () => {
  return async (ctx, next) => {
    await next()
    const { locale } = ctx.request.query
    ctx.response.body.data = translateEntity(ctx.response.body.data, locale)
  }
}
