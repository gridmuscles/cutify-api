'use strict'

module.exports = {
  routes: [
    {
      method: 'GET',
      path: '/organizations/:id/reviews',
      handler: 'organization.findReviews',
      config: {
        middlewares: [
          { name: 'global::locale' },
          { name: 'global::populate', config: { deep: 2 } },
        ],
      },
    },
  ],
}
