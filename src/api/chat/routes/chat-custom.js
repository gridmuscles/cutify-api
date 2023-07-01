'use strict'

module.exports = {
  routes: [
    {
      method: 'POST',
      path: '/chats/:id/mark-as-read',
      handler: 'chat.markAsRead',
      config: {
        policies: [
          { name: 'global::captcha', config: { action: 'CHAT_MARK_AS_READ' } },
        ],
        middlewares: [{ name: 'global::locale' }],
      },
    },
    {
      method: 'POST',
      path: '/chats/location/:locationId/promotion/:promotionId',
      handler: 'chat.createLocationPromotionChat',
      config: {
        middlewares: [{ name: 'global::locale' }],
      },
    },
  ],
}
