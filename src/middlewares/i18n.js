module.exports = () => {
  return async (ctx, next) => {
    await next()
    const { locale } = ctx.request.query
    ctx.response.body.data = translateObject(ctx.response.body.data, locale)
  }
}

const translateObject = (data, locale) => {
  if (Array.isArray(data)) {
    return data.map((item) => translateObject(item, locale))
  }

  const attributes = {}

  for (const key in data?.attributes) {
    if (
      data.attributes[key] &&
      (Array.isArray(data.attributes[key]) || typeof data.attributes[key] === 'object')
    ) {
      attributes[key] = {}
      attributes[key].data = translateObject(data.attributes[key].data, locale)
    } else if (key.includes('_')) {
      const [field, fieldLocale] = key.split('_')
      if (fieldLocale === locale && data?.attributes.hasOwnProperty(field)) {
        attributes[field] = data?.attributes[key]
      }
    } else {
      attributes[key] = data?.attributes[key]
    }
  }

  return { ...data, attributes }
}

/**
 *   "data": [
    {
      "id": 1,
      "attributes": {
        "title": "ua title",
        "description": "ua description",
        "terms": "ua terms",
        "slug": "promo1",
        "createdAt": "2023-03-11T12:29:14.212Z",
        "updatedAt": "2023-03-11T12:29:57.674Z",
        "publishedAt": "2023-03-11T12:29:57.667Z",
        "discountTo": 50,
        "categories": {
          "data": [
            {
              "id": 1,
              "attributes": {
                "title": "Beauty",
                "description": null,
                "createdAt": "2023-03-11T10:28:39.403Z",
                "updatedAt": "2023-03-11T10:28:39.403Z",
                "slug": "beauty",
                "title_pl": "Uroda",
                "title_ua": "Краса",
                "title_ru": "Красота",
                "description_pl": null,
                "description_ua": null,
                "description_ru": null
              }
            }
          ]
        },
        "organization": {
          "data": {
            "id": 1,
            "attributes": {
              "title": "Салон красоты Наталья",
              "description": "Стрижет как мама",
              "phone": "3123123123",
              "createdAt": "2023-03-11T12:28:11.369Z",
              "updatedAt": "2023-03-11T12:28:11.369Z",
              "description_pl": "po polsku",
              "description_ua": "по украiнскi",
              "description_ru": "по русски"
            }
          }
        }
      }
 */
