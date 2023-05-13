const { subMinutes } = require('date-fns')

let lastCronLaunchDateTime = subMinutes(new Date(), 15).toISOString()

module.exports = {
  newChatMessageNotification: {
    task: async ({ strapi }) => {
      const recipients = await strapi
        .service('api::chat.chat')
        .getUsersToNotificate({
          messagesCreatedAtStart: lastCronLaunchDateTime,
        })

      if (!recipients.length) {
        strapi.log.warn('No new messages in the chats')
        return
      }

      await strapi.plugins['email'].services.email.send({
        to: Array.from(recipients),
        subject: 'You have new messages!',
        html: `You have new messages! <br> Check https://cappybara.com/dashboard/chats to see all of them`,
      })

      lastCronLaunchDateTime = new Date().toISOString()
      strapi.log.warn(
        `Chat message notification cron job is finished at: ${lastCronLaunchDateTime}`
      )
    },
    options: {
      rule: '* */15 * * * *',
    },
  },
}
