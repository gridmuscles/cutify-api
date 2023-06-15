const translateEntity = (data, locale) => {
  if (!data) {
    return data
  }

  if (Array.isArray(data)) {
    return data.map((item) => translateEntity(item, locale))
  }

  const newData = {}

  for (const key in data) {
    if (
      data[key] &&
      (Array.isArray(data[key]) || typeof data[key] === 'object')
    ) {
      newData[key] = translateEntity(data[key], locale)
    } else if (key.includes('_')) {
      const [field, fieldLocale] = key.split('_')
      if (
        fieldLocale === locale &&
        Object.prototype.hasOwnProperty.call(data, field) &&
        data[key]
      ) {
        newData[field] = data[key]
      }
    } else {
      newData[key] = data[key]
    }
  }

  return newData
}

module.exports = {
  translateEntity,
}
