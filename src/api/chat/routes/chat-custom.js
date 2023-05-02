'use strict'

module.exports = {
  routes: [
    {
      method: 'POST',
      path: '/chats/:id/mark-as-read',
      handler: 'chat.markAsRead',
      config: {
        middlewares: [{ name: 'global::locale' }],
      },
    },
  ],
}
