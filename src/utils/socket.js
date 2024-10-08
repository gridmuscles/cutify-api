const init = async ({ strapi }) => {
  const io = require('socket.io')(strapi.server.httpServer, {
    path: '',
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  })
  strapi.io = io
  strapi.io.socketMap = new Map()
  const promotionChatNamespace = io.of('/chats')
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
      .findByUser({
        userId: socket.user,
        query: {
          populate: {
            promotion: true,
            messages: {
              sort: ['createdAt:asc'],
              populate: {
                user: {
                  fields: ['id', 'name'],
                },
              },
            },
            users: {
              fields: ['id', 'name'],
            },
          },
        },
      })
    socket.join(userChats.map((chat) => `chat:${chat.id}`))
    socket.on('disconnect', () => {
      console.log(`user id:${socket.user} disconnected`)
    })
  })
}

module.exports = {
  init,
}
