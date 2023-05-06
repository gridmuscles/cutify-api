'use strict'

module.exports = {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  register(/*{ strapi }*/) {},

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   *
   * This gives you an opportunity to set up your data model,
   * run jobs, or perform some special logic.
   */
  async bootstrap({ strapi }) {
    const io = require('socket.io')(strapi.server.httpServer, {
      path: '',
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
      },
    })
    strapi.io = io
    strapi.io.socketMap = new Map()
    const promotionChatNamespace = io.of('/promotion-chats')
    promotionChatNamespace.use(async (socket, next) => {
      console.log(`socket connected`)
      try {
        if (!socket.handshake.auth.token) {
          throw new Error()
        }
        const result = await strapi.plugins[
          'users-permissions'
        ].services.jwt.verify(socket.handshake.auth.token)
        socket.user = result.id
        next()
      } catch (error) {
        console.log(error)
      }
    })
    promotionChatNamespace.on('connection', async (socket) => {
      console.log(`user id:${socket.user} connected`)
      strapi.io.socketMap.set(socket.user, socket)
      const { results: userChats } = await strapi
        .service('api::chat.chat')
        .findByUser({ state: { user: { id: socket.user } } })
      socket.join(userChats.map((chat) => `chat:${chat.id}`))
      socket.on('disconnect', () => {
        console.log(`user id:${socket.user} disconnected`)
      })
    })
  },
}
