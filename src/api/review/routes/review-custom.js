'use strict'

module.exports = {
  routes: [
    {
      method: 'GET',
      path: '/reviews/organization/:organizationId',
      handler: 'review.findOrganizationReviews',
      config: {
        middlewares: [{ name: 'global::locale' }],
        policies: [
          {
            name: 'global::query',
            config: {
              allowedParams: [
                'filters',
                'sort',
                'pagination',
                'populate',
                'locale',
                'publicationState',
                'fields',
              ],
            },
          },
        ],
      },
    },
  ],
}
