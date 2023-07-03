const {
  isQueryParamsAllowed,
} = require('../../src/utils/is-query-params-allowed')

describe('Query params validation', () => {
  it.each([
    {
      query: { filters: {}, populate: {} },
      allowed: ['filters', 'populate'],
      result: true,
    },
    {
      query: { filters: {} },
      allowed: ['filters', 'populate'],
      result: true,
    },
    {
      query: { filters: {}, populate: {} },
      allowed: ['filters'],
      result: false,
    },
  ])(
    'query params $query if allowed $allowed then: $result',
    ({ query, allowed, result }) => {
      expect(isQueryParamsAllowed(query, allowed)).toBe(result)
    }
  )
})
