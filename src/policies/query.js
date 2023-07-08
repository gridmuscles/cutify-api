const { isQueryParamsAllowed } = require('../utils/is-query-params-allowed')

/**
 *
 * @param {*} ctx
 * @param { allowedParams: ['filters', 'sort', 'pagination', 'populate', 'locale', 'publicationState', 'fields', 'search']} config
 */

module.exports = async (ctx, { allowedParams }) => {
  try {
    return isQueryParamsAllowed(ctx.request.query, allowedParams)
  } catch (err) {
    strapi.log.error(err.message)
    ctx.badRequest(err.message, err.details)
  }
}
