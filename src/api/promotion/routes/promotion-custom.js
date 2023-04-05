'use strict'

module.exports = {
  routes: [
    {
      method: 'POST',
      path: '/promotions/:id/request',
      handler: 'promotion.requestCoupon',
    },
    {
      method: 'POST',
      path: '/promotions/:id/like',
      handler: 'promotion.like',
    },
  ],
}
