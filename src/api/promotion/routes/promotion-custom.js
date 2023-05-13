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
          { name: 'global::populate', config: { deep: 3 } },
        ],
      },
    },
    {
      method: 'POST',
      path: '/promotions/:id/chats',
      handler: 'promotion.createPromotionChat',
      config: {
        middlewares: [{ name: 'global::locale' }],
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
  ],
}
