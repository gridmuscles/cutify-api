'use strict'

module.exports = {
  routes: [
    {
      method: 'POST',
      path: '/chats/:id/mark-as-read',
      handler: 'chat.markAsRead',
      config: {
        middlewares: [{ name: 'global::locale' }],
        policies: [
          { name: 'global::captcha', config: { action: 'CHAT_MARK_AS_READ' } },
          { name: 'global::query', config: { allowedParams: ['locale'] } },
        ],
      },
    },
    {
      method: 'POST',
      path: '/chats/location/:locationId/promotion/:promotionId',
      handler: 'chat.createLocationPromotionChat',
      config: {
        middlewares: [{ name: 'global::locale' }],
        policies: [
          { name: 'global::query', config: { allowedParams: ['locale'] } },
        ],
      },
    },
    {
      method: 'GET',
      path: '/chats/user/me',
      handler: 'chat.findUserMeChats',
      config: {
        middlewares: [{ name: 'global::locale' }],
        policies: [
          {
            name: 'global::query',
            config: {
              allowedParams: ['locale', 'filters', 'pagination', 'sort'],
            },
          },
        ],
      },
    },
  ],
}
