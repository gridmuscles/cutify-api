module.exports = () => {
  return async (ctx, next) => {
    await next()
    const { locale } = ctx.request.query

    ctx.response.body.data = ctx.response.body.data.map(({ id, attributes }) => {
      return { id, attributes: translateObject(attributes, locale) }
    })
  }
}

const translateObject = (obj, locale) => {
  const result = {}

  for (const key in obj) {
    if (key.includes('_')) {
      const [field, fieldLocale] = key.split('_')
      if (fieldLocale === locale && obj.hasOwnProperty(field)) {
        result[field] = obj[key]
      }
    } else {
      result[key] = obj[key]
    }
  }

  return result
}
