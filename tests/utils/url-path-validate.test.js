// const { isValidUrlPath } = require('../../src/utils/url-path-validate')

describe.skip('Url validaton', () => {
  it.each([
    {
      url: 'path?param=value',
      result: true,
    },
    {
      url: 'coupons?filters[uuid][$in][0]=400267069-262509221&filters[uuid][$in][1]=400267069-262509221&filters[promotion][$eq]=12',
      result: true,
    },
    {
      url: 'example.com',
      result: false,
    },
    {
      url: 'http://example.com',
      result: false,
    },
    {
      url: 'https://example.com',
      result: false,
    },
    {
      url: 'ftp://example.com',
      result: false,
    },
    {
      url: 'example.com/path?param=value',
      result: false,
    },
    {
      url: 'http://example.com/path?param=value',
      result: false,
    },
    {
      url: 'https://example.com/path?param=value',
      result: false,
    },
    {
      url: 'ftp://example.com/path?param=value',
      result: false,
    },
    {
      url: 'subdomain.example.com',
      result: false,
    },
    {
      url: 'http://subdomain.example.com',
      result: false,
    },
    {
      url: 'https://subdomain.example.com',
      result: false,
    },
    {
      url: 'ftp://subdomain.example.com',
      result: false,
    },
    {
      url: 'subdomain.example.com/path?param=value',
      result: false,
    },
    {
      url: 'http://subdomain.example.com/path?param=value',
      result: false,
    },
    {
      url: 'https://subdomain.example.com/path?param=value',
      result: false,
    },
    {
      url: 'ftp://subdomain.example.com/path?param=value',
      result: false,
    },
    {
      url: 'sub.subdomain.example.com/path?param=value',
      result: false,
    },
  ])('isValidUrlPath $url', () => {
    // expect(isValidUrlPath(url)).toBe(result)
  })
})
