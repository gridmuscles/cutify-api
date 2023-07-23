'use strict'

module.exports = {
  routes: [
    {
      method: 'GET',
      path: '/articles/slug/:slug',
      handler: 'article.findBySlug',
      config: {
        middlewares: [{ name: 'global::locale' }, { name: 'global::i18n' }],
        policies: [
          {
            name: 'global::query',
            config: { allowedParams: ['populate', 'locale'] },
          },
        ],
      },
    },
  ],
}
