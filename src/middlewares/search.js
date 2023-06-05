module.exports = () => {
  return async (ctx, next) => {
    const { filters, locale } = ctx.request.query
    const title = filters?.title?.$containsi
    filters.$or = filters.$or ?? []

    delete filters.title

    if (title && locale === 'en') {
      filters.$or = [
        ...filters.$or,
        {
          title: {
            $containsi: title,
          },
        },
        {
          title_pl: {
            $containsi: title,
          },
        },
      ]
    }

    if (title && locale !== 'en') {
      filters.$or = [
        ...filters.$or,
        {
          title_pl: {
            $containsi: title,
          },
        },
        {
          [`title_${locale}`]: {
            $containsi: title,
          },
        },
      ]
    }

    await next()
  }
}
