const searchLocaleMap = {
  en: { title: 'title' },
  pl: { title: 'title_pl' },
  ru: { title: 'title_ru' },
  ua: { title: 'title_ua' },
}

const transformSearchQuery = (query) => {
  const { search, locale, filters, ...rest } = query

  const searchFilter = {
    $or: [
      {
        [searchLocaleMap['pl']['title']]: {
          $containsi: search,
        },
      },
      {
        [searchLocaleMap[locale]['title']]: {
          $containsi: search,
        },
      },
    ],
  }

  return {
    filters: {
      $and: [searchFilter, filters],
    },
    locale,
    ...rest,
  }
}

module.exports = {
  transformSearchQuery,
}
