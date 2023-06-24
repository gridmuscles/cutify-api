'use strict'

module.exports = {
  routes: [
    {
      method: 'POST',
      path: '/promotions/:id/request',
      handler: 'promotion.requestCoupon',
      config: {
        middlewares: [
          { name: 'global::locale' },
          { name: 'global::populate', config: { deep: 3 } },
        ],
      },
    },
    {
      method: 'POST',
      path: '/promotions/:id/like',
      handler: 'promotion.like',
    },
    {
      method: 'POST',
      path: '/promotions/:id/auction/complete',
      handler: 'promotion.completeAuction',
      config: {
        middlewares: [
          { name: 'global::locale' },
          { name: 'global::populate', config: { deep: 2 } },
        ],
      },
    },
    {
      method: 'POST',
      path: '/promotions/:id/auction/verify',
      handler: 'promotion.verifyAuction',
      config: {
        middlewares: [
          { name: 'global::locale' },
          { name: 'global::populate', config: { deep: 2 } },
        ],
      },
    },
    {
      method: 'GET',
      path: '/promotions/:id/coupons',
      handler: 'promotion.findCoupons',
      config: {
        middlewares: [{ name: 'global::locale' }],
      },
    },
    {
      method: 'GET',
      path: '/promotions/manager',
      handler: 'promotion.findManagerPromotions',
      config: {
        middlewares: [
          { name: 'global::locale' },
          { name: 'global::i18n' },
          { name: 'global::populate', config: { deep: 2 } },
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
      },
    },
    {
      method: 'GET',
      path: '/promotions/:id/recommendations',
      handler: 'promotion.findRecommendations',
      config: {
        middlewares: [{ name: 'global::locale' }, { name: 'global::i18n' }],
      },
    },
    {
      method: 'GET',
      path: '/promotions/:id/similar',
      handler: 'promotion.findSimilar',
      config: {
        middlewares: [{ name: 'global::locale' }, { name: 'global::i18n' }],
      },
    },
  ],
}
