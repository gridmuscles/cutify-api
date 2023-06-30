const {
  transformSearchQuery,
} = require('../../src/utils/transform-search-query')

describe('Tranform search query', () => {
  it.each([
    {
      locale: 'en',
      query: {
        search: 'test',
        filters: {
          propA: {
            $not: 1,
          },
          propB: 2,
        },
      },
      result: {
        $and: [
          {
            $or: [
              {
                title_pl: {
                  $containsi: 'test',
                },
              },
              {
                title: {
                  $containsi: 'test',
                },
              },
            ],
          },
          {
            propA: {
              $not: 1,
            },
            propB: 2,
          },
        ],
      },
    },
    {
      locale: 'pl',
      query: {
        search: 'test',
        filters: {
          propA: {
            $not: 1,
          },
          propB: 2,
        },
      },
      result: {
        $and: [
          {
            $or: [
              {
                title_pl: {
                  $containsi: 'test',
                },
              },
              {
                title_pl: {
                  $containsi: 'test',
                },
              },
            ],
          },
          {
            propA: {
              $not: 1,
            },
            propB: 2,
          },
        ],
      },
    },
    {
      locale: 'ru',
      query: {
        search: 'test',
        filters: {
          propA: {
            $not: 1,
          },
          propB: 2,
        },
      },
      result: {
        $and: [
          {
            $or: [
              {
                title_pl: {
                  $containsi: 'test',
                },
              },
              {
                title_ru: {
                  $containsi: 'test',
                },
              },
            ],
          },
          {
            propA: {
              $not: 1,
            },
            propB: 2,
          },
        ],
      },
    },
  ])('transformSearchQuery $locale', ({ locale, query, result }) => {
    expect(transformSearchQuery({ locale, ...query })).toStrictEqual(result)
  })
})
