'use strict'

module.exports = {
  routes: [
    {
      method: 'POST',
      path: '/promotions/:id/request',
      handler: 'promotion.requestCoupon',
      config: {
        policies: [
          { name: 'global::captcha', config: { action: 'REQUEST_COUPON' } },
          { name: 'global::query', config: { allowedParams: [] } },
        ],
        middlewares: [{ name: 'global::locale' }],
      },
    },
    {
      method: 'POST',
      path: '/promotions/:id/like',
      handler: 'promotion.like',
      policies: [
        { name: 'global::captcha', config: { action: 'PROMOTION_LIKE' } },
        { name: 'global::query', config: { allowedParams: [] } },
      ],
    },
    {
      method: 'POST',
      path: '/promotions/:id/auction/complete',
      handler: 'promotion.completeAuction',
      config: {
        middlewares: [{ name: 'global::locale' }],
        policies: [{ name: 'global::query', config: { allowedParams: [] } }],
      },
    },
    {
      method: 'POST',
      path: '/promotions/:id/auction/verify',
      handler: 'promotion.verifyAuction',
      config: {
        middlewares: [{ name: 'global::locale' }],
        policies: [{ name: 'global::query', config: { allowedParams: [] } }],
      },
    },
    {
      method: 'GET',
      path: '/promotions/manager',
      handler: 'promotion.findManagerPromotionList',
      config: {
        middlewares: [{ name: 'global::locale' }, { name: 'global::i18n' }],
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
                'search',
              ],
            },
          },
        ],
      },
    },
    {
      method: 'GET',
      path: '/promotions/:id/confirmation-code',
      handler: 'promotion.getPromotionConfirmationCode',
      config: {
        middlewares: [
          { name: 'global::locale' },
          { name: 'global::i18n' },
          { name: 'global::populate', config: { deep: 2 } },
        ],
        policies: [{ name: 'global::query', config: { allowedParams: [] } }],
      },
    },
    {
      method: 'GET',
      path: '/promotions/:id/recommendations',
      handler: 'promotion.findRecommendations',
      config: {
        middlewares: [{ name: 'global::locale' }, { name: 'global::i18n' }],
        policies: [
          { name: 'global::query', config: { allowedParams: ['populate'] } },
        ],
      },
    },
    {
      method: 'GET',
      path: '/promotions/:id/similar',
      handler: 'promotion.findSimilar',
      config: {
        middlewares: [{ name: 'global::locale' }, { name: 'global::i18n' }],
        policies: [
          { name: 'global::query', config: { allowedParams: ['populate'] } },
        ],
      },
    },
    {
      method: 'GET',
      path: '/promotions/slug/:slug',
      handler: 'promotion.findBySlug',
      config: {
        middlewares: [{ name: 'global::locale' }, { name: 'global::i18n' }],
        policies: [
          {
            name: 'global::query',
            config: { allowedParams: ['populate', 'views'] },
          },
        ],
      },
    },
  ],
}
