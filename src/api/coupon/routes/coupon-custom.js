'use strict'

module.exports = {
  routes: [
    {
      method: 'GET',
      path: '/coupons/uuid',
      handler: 'coupon.findByUuidList',
      config: {
        middlewares: [
          { name: 'global::locale' },
          { name: 'global::populate', config: { deep: 3 } },
        ],
      },
    },
    {
      method: 'POST',
      path: '/coupons/:id/verify',
      handler: 'coupon.verify',
    },
  ],
}
