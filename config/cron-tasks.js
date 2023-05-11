let lastCronLaunchDateTime = new Date().toISOString()

module.exports = {
  newChatMessageNotification: {
    task: async ({ strapi }) => {
      const recipients = await strapi
        .service('api::chat.chat')
        .getUsersToNotificate({
          messagesCreatedAtStart: lastCronLaunchDateTime,
        })

      if (!recipients.length) {
        return
      }

      await strapi.plugins['email'].services.email.send({
        to: Array.from(recipients),
        subject: 'You have a new messages!',
        text: 'You have a new messages!',
      })

      lastCronLaunchDateTime = new Date().toISOString()
    },
    options: {
      rule: '* */30 * * * *',
    },
  },
}
