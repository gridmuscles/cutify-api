module.exports = () => {
  return async (ctx, next) => {
    await next()
    const { locale } = ctx.request.query
    ctx.response.body.data = translateObject(ctx.response.body.data, locale)
  }
}

const translateObject = (data, locale) => {
  if (!data) {
    return data
  }

  if (Array.isArray(data)) {
    return data.map((item) => translateObject(item, locale))
  }

  const attributes = {}

  for (const key in data?.attributes) {
    if (
      data.attributes[key] &&
      (Array.isArray(data.attributes[key]) ||
        typeof data.attributes[key] === 'object')
    ) {
      attributes[key] = {}
      attributes[key].data = translateObject(data.attributes[key].data, locale)
    } else if (key.includes('_')) {
      const [field, fieldLocale] = key.split('_')
      if (
        fieldLocale === locale &&
        Object.prototype.hasOwnProperty.call(data?.attributes, field)
      ) {
        attributes[field] = data?.attributes[key]
      }
    } else {
      attributes[key] = data?.attributes[key]
    }
  }

  return { ...data, attributes }
}
