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

  plugin.controllers.user.findMeChats = async (ctx) => {
    const { transformResponse } = await strapi.controller('api::chat.chat')

    const { results } = await strapi.service('api::chat.chat').find({
      filters: {
        users: {
          id: {
            $contains: ctx.state.user.id,
          },
        },
      },
      populate: {
        promotion: true,
        messages: {
          sort: ['createdAt:asc'],
          populate: {
            user: {
              fields: ['id'],
            },
          },
        },
        users: {
          fields: ['id'],
        },
      },
    })

    return transformResponse(results)
  }

  plugin.routes['content-api'].routes.push({
    method: 'GET',
    path: '/users/me/chats',
    handler: 'user.findMeChats',
    config: {
      prefix: '',
      middlewares: [{ name: 'global::locale' }],
    },
  })

  return plugin
}
