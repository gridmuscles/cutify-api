module.exports = () => {
  return async (ctx, next) => {
    ctx.request.query = {
      ...ctx.request.query,
      locale: ctx.request.query.locale ?? 'en',
    }

    await next()
  }
}
