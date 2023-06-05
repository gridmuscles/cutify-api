module.exports = () => {
  return async (ctx, next) => {
    const { search, locale } = ctx.request.query

    if (search) {
      ctx.request.query.filters = {
        $and: [
          ctx.request.query.filters,
          tranformSearchFilters({ search, locale }),
        ],
      }
    }

    await next()
  }
}

const tranformSearchFilters = ({ search, locale }) => {
  if (search && locale === 'en') {
    return {
      $or: [
        {
          title: {
            $containsi: search,
          },
        },
        {
          title_pl: {
            $containsi: search,
          },
        },
      ],
    }
  }

  return {
    $or: [
      {
        title_pl: {
          $containsi: search,
        },
      },
      {
        [`title_${locale}`]: {
          $containsi: search,
        },
      },
    ],
  }
}
