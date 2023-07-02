'use strict'

module.exports = {
  routes: [
    {
      method: 'POST',
      path: '/messages/chat/:chatId',
      handler: 'message.createChatMessage',
      config: {
        policies: [
          { name: 'global::captcha', config: { action: 'CHAT_SEND_MESSAGE' } },
          { name: 'global::query', config: { allowedParams: ['locale'] } },
        ],
        middlewares: [{ name: 'global::locale' }],
      },
    },
  ],
}
