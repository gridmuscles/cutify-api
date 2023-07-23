module.exports = () => {
  return async (ctx, next) => {
    ctx.request.query = {
      ...ctx.request.query,

      filters: {
        ...(ctx.request.query.filters ?? {}),
        isPage: false,
      },
    }

    await next()
  }
}
