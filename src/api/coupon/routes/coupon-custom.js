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
          { name: 'global::i18n' },
          { name: 'global::populate', config: { deep: 3 } },
        ],
      },
    },
    {
      method: 'POST',
      path: '/coupons/verify',
      handler: 'coupon.verify',
    },
  ],
}
