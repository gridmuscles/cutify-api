module.exports = (plugin) => {
  const bootstrap = plugin.bootstrap.bind({})

  plugin.bootstrap = async ({ strapi }) => {
    await bootstrap({ strapi })

    const pluginStore = await strapi.store({
      environment: '',
      type: 'plugin',
      name: 'users-permissions',
    })

    const {
      forgotPassword: { resetPasswordUrl, title, from, replyTo },
    } = strapi.config.get('admin')

    const advancedSettings = await pluginStore.get({ key: 'advanced' })

    await pluginStore.set({
      key: 'advanced',
      value: {
        ...advancedSettings,
        email_reset_password: resetPasswordUrl,
      },
    })

    await pluginStore.set({
      key: 'email',
      value: {
        reset_password: {
          display: 'Email.template.reset_password',
          icon: 'sync',
          options: {
            from: {
              name: title,
              email: from,
            },
            response_email: replyTo,
            object: `${title} - Reset password`,
            message: `<p>We heard that you lost your password. Sorry about that!</p>\n
                \n
                <p>But don't worry! You can use the following link to reset your password:</p>\n
                <p><a href="<%= URL %>?code=<%= TOKEN %>">Reset password</a></p>\n
                \n
                <p>Thanks.</p>`,
          },
        },
        email_confirmation: {
          display: 'Email.template.email_confirmation',
          icon: 'check-square',
          options: {
            from: {
              name: title,
              email: from,
            },
            response_email: replyTo,
            object: `${title} - Email confirmation`,
            message: `<p>Thank you for registering!</p>\n
                \n
                <p>You have to confirm your email address. Please click on the link below.</p>\n
                \n
                <p><a href="<%= URL %>?confirmation=<%= CODE %>">Confirm email</a></p>\n
                \n
                <p>Thanks.</p>`,
          },
        },
      },
    })
  }

  plugin.controllers.user.createChat = async (ctx) => {
    try {
      const { transformResponse } = await strapi.controller('api::chat.chat')

      const { promotionId } = ctx.request.body.data

      const promotion = await strapi.entityService.findOne(
        'api::promotion.promotion',
        promotionId,
        { populate: ['organization.id', 'organization.managers'] }
      )

      const { results } = await strapi.service('api::chat.chat').find({
        filters: {
          promotion: promotion.id,
          users: {
            id: {
              $contains: ctx.state.user.id,
            },
          },
        },
      })

      if (results.length > 0) {
        throw new Error()
      }

      const newChat = await strapi.service('api::chat.chat').create({
        data: {
          promotion: promotion.id,
          users: [ctx.state.user.id],
        },
        populate: {
          promotion: true,
          messages: true,
          users: {
            fields: ['id'],
          },
        },
      })

      for (let manager of promotion.organization.managers) {
        const socket = strapi.io.socketMap?.get(manager.id)
        if (socket) {
          socket.join(`chat:${newChat.id}`)
        }
      }

      const userSocket = strapi.io.socketMap?.get(ctx.state.user.id)
      userSocket?.join(`chat:${newChat.id}`)
      userSocket
        ?.to(`chat:${newChat.id}`)
        .emit('receiveChatSuccess', transformResponse(newChat))

      return transformResponse(newChat)
    } catch (err) {
      strapi.log.error(err)
      ctx.badRequest()
    }
  }

  plugin.controllers.user.findChats = async (ctx) => {
    try {
      const { transformResponse } = await strapi.controller('api::chat.chat')
      const { results } = await strapi.service('api::chat.chat').findByUser(ctx)
      return transformResponse(results)
    } catch (err) {
      strapi.log.error(err)
      ctx.badRequest()
    }
  }

  plugin.controllers.user.createChatMessage = async (ctx) => {
    try {
      const { transformResponse } = await strapi.controller(
        'api::message.message'
      )

      const ifChatOwner = await strapi
        .service('api::chat.chat')
        .ifChatOwner(ctx)

      if (!ifChatOwner) {
        throw new Error()
      }

      const message = await strapi.service('api::message.message').create({
        data: {
          text: ctx.request.body.data.text,
          user: ctx.state.user.id,
          chat: ctx.params.id,
        },
        populate: {
          chat: {
            fields: ['id'],
          },
          user: {
            fields: ['id'],
          },
        },
      })

      const transformedMessage = await transformResponse(message)

      const userSocket = strapi.io.socketMap?.get(ctx.state.user.id)
      userSocket
        ?.to(`chat:${ctx.params.id}`)
        .emit('receiveChatMessageSuccess', transformedMessage)

      return transformedMessage
    } catch (err) {
      strapi.log.error(err)
      ctx.badRequest()
    }
  }

  plugin.routes['content-api'].routes.push({
    method: 'GET',
    path: '/users/me/chats',
    handler: 'user.findChats',
    config: {
      prefix: '',
      middlewares: [{ name: 'global::locale' }],
    },
  })

  plugin.routes['content-api'].routes.push({
    method: 'POST',
    path: '/users/me/chats',
    handler: 'user.createChat',
    config: {
      prefix: '',
      middlewares: [{ name: 'global::locale' }],
    },
  })

  plugin.routes['content-api'].routes.push({
    method: 'POST',
    path: '/users/me/chats/:id/message',
    handler: 'user.createChatMessage',
    config: {
      prefix: '',
      middlewares: [{ name: 'global::locale' }],
    },
  })

  return plugin
}
