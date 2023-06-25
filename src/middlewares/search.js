const transformSearchQuery = require('../utils/transform-search-query')

module.exports = () => {
  return async (ctx, next) => {
    const { search } = ctx.request.query

    if (search) {
      ctx.request.query.filters = transformSearchQuery(ctx.request.query)
    }

    await next()
  }
}
