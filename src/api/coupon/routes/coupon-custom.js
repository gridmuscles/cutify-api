'use strict'

module.exports = {
  routes: [
    {
      method: 'GET',
      path: '/coupons/uuid',
      handler: 'coupon.findByPromotionAndUuidList',
      config: {
        middlewares: [
          { name: 'global::locale' },
          { name: 'global::i18n' },
          { name: 'global::populate', config: { deep: 3 } },
        ],
      },
    },
    {
      method: 'GET',
      path: '/coupons/promotion/:promotionId/uuid',
      handler: 'coupon.findByPromotionAndUuidList',
      config: {
        middlewares: [
          { name: 'global::locale' },
          { name: 'global::i18n' },
          { name: 'global::populate', config: { deep: 3 } },
        ],
      },
    },
    {
      method: 'GET',
      path: '/coupons/uuid/download/pdf',
      handler: 'coupon.downloadPdf',
      config: {
        middlewares: [{ name: 'global::locale' }],
      },
    },
    {
      method: 'POST',
      path: '/coupons/verify',
      handler: 'coupon.verify',
    },
    {
      method: 'POST',
      path: '/coupons/verify/code',
      handler: 'coupon.verifyWithCode',
      policies: [
        { name: 'global::captcha', config: { action: 'COUPON_VERIFY_CODE' } },
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
      ],
    },
  ],
}
