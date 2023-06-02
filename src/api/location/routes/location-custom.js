'use strict'

module.exports = {
  routes: [
    {
      method: 'POST',
      path: '/locations/:id/chats',
      handler: 'location.createLocationChat',
      config: {
        middlewares: [{ name: 'global::locale' }],
      },
    },
  ],
}
