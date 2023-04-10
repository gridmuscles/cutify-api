// const EMAIL_TEMPLATE_DATA = {
//   en: {
//     reset_password: {
//       display: 'Email.template.reset_password',
//       icon: 'sync',
//       options: {
//         from: {
//           name: 'Administration Panel',
//           email: 'no-reply@strapi.io',
//         },
//         response_email: 'support@cappybara.com',
//         object: 'Cappybara.com - Reset password',
//         message: `<p>We heard that you lost your password. Sorry about that!</p>\n
//           \n
//           <p>But don't worry! You can use the following link to reset your password:</p>\n
//           <p><a href="${ctx.request.header.origin}/reset-password?code=<%= TOKEN %>">Reset password</a></p>\n
//           \n
//           <p>Thanks.</p>`,
//       },
//     },
//     email_confirmation: {
//       display: 'Email.template.email_confirmation',
//       icon: 'check-square',
//       options: {
//         from: {
//           name: 'Administration Panel',
//           email: 'no-reply@strapi.io',
//         },
//         response_email: 'support@cappybara.com',
//         object: 'Cappybara.com - Email confirmation',
//         message: `<p>Thank you for registering!</p>\n
//           \n
//           <p>You have to confirm your email address. Please click on the link below.</p>\n
//           \n
//           <p><%= URL %>?confirmation=<%= CODE %></p>\n
//           <p><a href="${ctx.request.header.origin}/reset-password?confirmation=<%= CODE %>">Confirm</a></p>\n

//           \n
//           <p>Thanks.</p>`,
//       },
//     },
//   },
//   pl: {},
//   ua: {},
//   ru: {},
// }

module.exports = async (plugin) => {
  // const pluginStore = await strapi.store({
  //   type: 'plugin',
  //   name: 'users-permissions',
  // })

  // pluginStore.set({ key: 'email', value: {} })

  // const register = plugin.controllers.auth.register.bind({})
  // const emailConfirmation = plugin.controllers.auth.emailConfirmation.bind({})
  // const forgotPassword = plugin.controllers.auth.forgotPassword.bind({})

  // plugin.controllers.auth.register = async (ctx) => {
  //   const body = { ...ctx.request.body }

  //   ctx.request.body = { data: { info: ctx.request.body.info } }
  //   const infoId = await createRelation('api::user-info.user-info', ctx, 'info')

  //   ctx.request.body = { ...body, info: infoId }
  //   return register(ctx)
  // }

  // plugin.controllers.auth.emailConfirmation = async (ctx) => {
  //   try {
  //     emailConfirmation(ctx)
  //   } catch (err) {
  //     console.log(err)
  //   }
  //   return emailConfirmation(ctx)
  // }

  // plugin.controllers.auth.forgotPassword = async (ctx) => {
  //   const pluginStore = await strapi.store({
  //     type: 'plugin',
  //     name: 'users-permissions',
  //   })

  //   const emailSettings = await pluginStore.get({ key: 'email' })
  //   const advancedSettings = await pluginStore.get({ key: 'advanced' })

  //   console.log(emailSettings)
  //   console.log(advancedSettings)

  //   return forgotPassword(ctx)
  // }

  // plugin.controllers.auth.forgotPassword = async (ctx) => {
  //   const pluginStore = await strapi.store({
  //     type: 'plugin',
  //     name: 'users-permissions',
  //   })

  //   await pluginStore.set({
  //     key: 'email',
  //     value: {
  //       reset_password: {
  //         display: 'Email.template.reset_password',
  //         icon: 'sync',
  //         options: {
  //           from: [Object],
  //           response_email: 'support@cappybara.com',
  //           object: 'Cappybara.com - Reset password',
  //           message: `<p>We heard that you lost your password. Sorry about that!</p>\n
  //             \n
  //             <p>But don't worry! You can use the following link to reset your password:</p>\n
  //             <p><a href="${ctx.request.header.origin}/reset-password?code=<%= TOKEN %>">Reset password</a></p>\n
  //             \n
  //             <p>Thanks.</p>`,
  //         },
  //       },
  //       email_confirmation: {
  //         display: 'Email.template.email_confirmation',
  //         icon: 'check-square',
  //         options: {
  //           from: [Object],
  //           response_email: 'support@cappybara.com',
  //           object: 'Cappybara.com - Email confirmation',
  //           message: `<p>Thank you for registering!</p>\n
  //             \n
  //             <p>You have to confirm your email address. Please click on the link below.</p>\n
  //             \n
  //             <p><%= URL %>?confirmation=<%= CODE %></p>\n
  //             <p><a href="${ctx.request.header.origin}/reset-password?confirmation=<%= CODE %>">Confirm</a></p>\n

  //             \n
  //             <p>Thanks.</p>`,
  //         },
  //       },
  //     },
  //   })

  //   console.log(await pluginStore.get({ key: 'email' }))
  //   console.log(await pluginStore.get({ key: 'advanced' }))

  //   return forgotPassword(ctx)
  // }

  // plugin.controllers.auth.forgotPassword = async (ctx) => {
  //   const { email } = await validateForgotPasswordBody(ctx.request.body);

  //   const pluginStore = await strapi.store({ type: 'plugin', name: 'users-permissions' });

  //   const emailSettings = await pluginStore.get({ key: 'email' });
  //   const advancedSettings = await pluginStore.get({ key: 'advanced' });

  //   // Find the user by email.
  //   const user = await strapi
  //     .query('plugin::users-permissions.user')
  //     .findOne({ where: { email: email.toLowerCase() } });

  //   if (!user || user.blocked) {
  //     return ctx.send({ ok: true });
  //   }

  //   // Generate random token.
  //   const userInfo = await sanitizeUser(user, ctx);

  //   const resetPasswordToken = crypto.randomBytes(64).toString('hex');

  //   const resetPasswordSettings = _.get(emailSettings, 'reset_password.options', {});
  //   const emailBody = await getService('users-permissions').template(
  //     resetPasswordSettings.message,
  //     {
  //       URL: advancedSettings.email_reset_password,
  //       SERVER_URL: getAbsoluteServerUrl(strapi.config),
  //       ADMIN_URL: getAbsoluteAdminUrl(strapi.config),
  //       USER: userInfo,
  //       TOKEN: resetPasswordToken,
  //     }
  //   );

  //   const emailObject = await getService('users-permissions').template(
  //     resetPasswordSettings.object,
  //     {
  //       USER: userInfo,
  //     }
  //   );

  //   const emailToSend = {
  //     to: user.email,
  //     from:
  //       resetPasswordSettings.from.email || resetPasswordSettings.from.name
  //         ? `${resetPasswordSettings.from.name} <${resetPasswordSettings.from.email}>`
  //         : undefined,
  //     replyTo: resetPasswordSettings.response_email,
  //     subject: emailObject,
  //     text: emailBody,
  //     html: emailBody,
  //   };

  //   // NOTE: Update the user before sending the email so an Admin can generate the link if the email fails
  //   await getService('user').edit(user.id, { resetPasswordToken });

  //   // Send an email to the user.
  //   await strapi.plugin('email').service('email').send(emailToSend);

  //   ctx.send({ ok: true });
  // },

  // plugin.policies = {
  //   ...plugin.policies,
  //   'is-owner': isOwner,
  //   'register-validation': registerValidation,
  //   'update-validation': updateValidation,
  // }

  // const routes = plugin.routes['content-api'].routes
  // let registerRoute = routes.find(({ path }) => path === '/auth/local/register')
  // registerRoute.config = {
  //   ...registerRoute.config,
  //   policies: ['register-validation'],
  // }

  // let updateRoute = routes.find(
  //   ({ path, method }) => path === '/users/:id' && method === 'PUT'
  // )
  // updateRoute.config = {
  //   ...updateRoute.config,
  //   policies: ['is-owner', 'update-validation'],
  // }

  return plugin
}
