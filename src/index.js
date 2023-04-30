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
    const { transformResponse: transformMessageResponse } =
      await strapi.controller('api::message.message')

    const io = require('socket.io')(strapi.server.httpServer, {
      path: '',
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
      },
    })

    const promotionChatNamespace = io.of('/promotion-chats')

    promotionChatNamespace.use(async (socket, next) => {
      console.log(`socket connected`)
      console.log(io.sockets.length)

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

      const { results: userChats } = await strapi
        .service('api::chat.chat')
        .find({
          filters: {
            users: {
              id: {
                $contains: socket.user,
              },
            },
          },
        })

      socket.join(userChats.map((chat) => `chat:${chat.id}`))

      socket.on('sendChatMessage', async ({ data: { chatId, text } }) => {
        strapi.log.info(
          `New message data received chat:${chatId}, text:${text}`
        )

        try {
          const chat = await strapi
            .service('api::chat.chat')
            .findOne(chatId, { populate: '*' })

          // strapi.log.info(JSON.stringify(chat))

          if (!chat.users.some(({ id }) => id === socket.user)) {
            socket.emit('receiveChatMessageError', {})
            throw new Error(
              `User id:${socket.user} is not a member of the chat id:${chat.id}`
            )
          }

          const newMessage = await strapi
            .service('api::message.message')
            .create({
              data: {
                text,
                user: socket.user,
                chat: chat.id,
              },
              populate: {
                user: {
                  fields: ['id'],
                },
                chat: {
                  fields: ['id'],
                },
              },
            })

          socket.emit(
            'receiveChatMessageSuccess',
            transformMessageResponse(newMessage)
          )

          socket
            .to(`chat:${chat.id}`)
            .emit(
              'receiveChatMessageSuccess',
              transformMessageResponse(newMessage)
            )
        } catch (err) {
          strapi.log.error(err)
        }
      })

      socket.on('disconnect', () => {
        console.log(`user id:${socket.user} disconnected`)
      })
    })

    strapi.io = io
  },
}
