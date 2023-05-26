'use strict'

module.exports = {
  routes: [
    {
      method: 'GET',
      path: '/static-pages/:slug',
      handler: 'static-pages.findOne',
      config: {
        middlewares: [{ name: 'global::locale' }, { name: 'global::i18n' }],
      },
    },
  ],
}
