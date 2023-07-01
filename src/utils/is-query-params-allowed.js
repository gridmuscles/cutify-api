const isQueryParamsAllowed = (query, allowedParams) => {
  return Object.keys(query).every((param) => allowedParams.includes(param))
}

module.exports = {
  isQueryParamsAllowed,
}
