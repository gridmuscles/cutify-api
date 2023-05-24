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

  const newData = {}

  for (const key in data) {
    if (
      data[key] &&
      (Array.isArray(data[key]) || typeof data[key] === 'object')
    ) {
      newData[key] = translateObject(data[key], locale)
    } else if (key.includes('_')) {
      const [field, fieldLocale] = key.split('_')
      if (
        fieldLocale === locale &&
        Object.prototype.hasOwnProperty.call(data, field)
      ) {
        newData[field] = data[key]
      }
    } else {
      newData[key] = data[key]
    }
  }

  return newData
}
