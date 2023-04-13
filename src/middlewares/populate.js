module.exports = (config) => {
  return async (ctx, next) => {
    const { deep } = config

    ctx.request.query = {
      ...ctx.request.query,
      populate: `deep,${deep}`,
    }

    await next()
  }
}
