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

  const routes = plugin.routes['content-api'].routes

  const registerRoute = routes.find(
    ({ path }) => path === '/auth/local/register'
  )
  registerRoute.config = {
    ...registerRoute.config,
    policies: [{ name: 'global::captcha', config: { action: 'REGISTER' } }],
  }

  const loginRoute = routes.find(({ path }) => path === '/auth/local')
  loginRoute.config = {
    ...loginRoute.config,
    policies: [{ name: 'global::captcha', config: { action: 'LOGIN' } }],
  }

  const forgotPasswordRoute = routes.find(
    ({ path }) => path === '/auth/forgot-password'
  )
  forgotPasswordRoute.config = {
    ...forgotPasswordRoute.config,
    policies: [
      { name: 'global::captcha', config: { action: 'FORGOT_PASSWORD' } },
    ],
  }

  const resetPasswordRoute = routes.find(
    ({ path }) => path === '/auth/reset-password'
  )
  resetPasswordRoute.config = {
    ...resetPasswordRoute.config,
    policies: [
      { name: 'global::captcha', config: { action: 'RESET_PASSWORD' } },
    ],
  }

  return plugin
}
