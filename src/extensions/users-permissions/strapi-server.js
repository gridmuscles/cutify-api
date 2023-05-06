module.exports = (plugin) => {
  const sanitizeOutput = (user) => {
    /* eslint-disable no-unused-vars */
    const {
      password,
      resetPasswordToken,
      confirmationToken,
      ...sanitizedUser
    } = user
    /* eslint-enable */

    return sanitizedUser
  }

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

  plugin.controllers.user.findChats = async (ctx) => {
    try {
      const {
        transformResponse: transformChatResponse,
        sanitizeQuery: sanitizeChatQuery,
      } = await strapi.controller('api::chat.chat')

      const sanitizedQueryParams = await sanitizeChatQuery(ctx)
      ctx.request.query = sanitizedQueryParams

      const { results } = await strapi.service('api::chat.chat').findByUser(ctx)
      return transformChatResponse(results)
    } catch (err) {
      strapi.log.error(err)
      ctx.badRequest()
    }
  }

  plugin.controllers.user.findCoupons = async (ctx) => {
    const {
      transformResponse: transformCouponResponse,
      sanitizeOutput: sanitizeCouponOutput,
      sanitizeQuery: sanitizeCouponQuery,
    } = await strapi.controller('api::coupon.coupon')

    const sanitizedQueryParams = await sanitizeCouponQuery(ctx)
    ctx.request.query = sanitizedQueryParams

    try {
      ctx.request.query.filters
      ctx.request.query.filters = {
        ...(ctx.request.query.filters ?? {}),
        user: ctx.state?.user?.id,
      }

      const { results, pagination } = await strapi
        .service('api::coupon.coupon')
        .find({
          ...ctx.request.query,
        })

      const sanitizedResults = await sanitizeCouponOutput(results, ctx)
      return transformCouponResponse(sanitizedResults, { pagination })
    } catch (err) {
      strapi.log.error(err)
      ctx.badRequest()
    }
  }

  plugin.controllers.user.me = async (ctx) => {
    if (!ctx.state.user) {
      return ctx.unauthorized()
    }
    const user = await strapi.entityService.findOne(
      'plugin::users-permissions.user',
      ctx.state.user.id,
      { populate: ['role'] }
    )

    ctx.body = sanitizeOutput(user)
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
    method: 'GET',
    path: '/users/me/coupons',
    handler: 'user.findCoupons',
    config: {
      prefix: '',
      middlewares: [
        { name: 'global::locale' },
        { name: 'global::populate', config: { deep: 3 } },
      ],
    },
  })

  return plugin
}
