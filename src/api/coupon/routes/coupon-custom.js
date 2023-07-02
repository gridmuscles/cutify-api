'use strict'

module.exports = {
  routes: [
    {
      method: 'GET',
      path: '/coupons/uuid',
      handler: 'coupon.findByPromotionAndUuidList',
      config: {
        middlewares: [{ name: 'global::locale' }, { name: 'global::i18n' }],
        policies: [
          {
            name: 'global::query',
            config: { allowedParams: ['locale', 'filters', 'populate'] },
          },
        ],
      },
    },
    {
      method: 'GET',
      path: '/coupons/promotion/:promotionId/uuid',
      handler: 'coupon.findByPromotionAndUuidList',
      config: {
        middlewares: [{ name: 'global::locale' }, { name: 'global::i18n' }],
        policies: [
          {
            name: 'global::query',
            config: { allowedParams: ['locale', 'filters', 'populate'] },
          },
        ],
      },
    },
    {
      method: 'GET',
      path: '/coupons/uuid/download/pdf',
      handler: 'coupon.downloadPdf',
      config: {
        middlewares: [{ name: 'global::locale' }],
        policies: [
          { name: 'global::query', config: { allowedParams: ['locale'] } },
        ],
      },
    },
    {
      method: 'POST',
      path: '/coupons/verify',
      handler: 'coupon.verify',
      policies: [
        { name: 'global::query', config: { allowedParams: ['locale'] } },
      ],
    },
    {
      method: 'POST',
      path: '/coupons/verify/code',
      handler: 'coupon.verifyWithCode',
      policies: [
        { name: 'global::captcha', config: { action: 'COUPON_VERIFY_CODE' } },
        { name: 'global::query', config: { allowedParams: ['locale'] } },
      ],
    },
    {
      method: 'POST',
      path: '/coupons/verify/receipt',
      handler: 'coupon.verifyWithReceipt',
      policies: [
        {
          name: 'global::captcha',
          config: { action: 'COUPON_VERIFY_RECEIPT' },
        },
        { name: 'global::query', config: { allowedParams: ['locale'] } },
      ],
    },
    {
      method: 'GET',
      path: '/coupons/user/me',
      handler: 'coupon.getUserMeCoupons',
      config: {
        middlewares: [{ name: 'global::locale' }, { name: 'global::i18n' }],
        policies: [
          {
            name: 'global::query',
            config: { allowedParams: ['locale', 'filters', 'populate'] },
          },
        ],
      },
    },
  ],
}
