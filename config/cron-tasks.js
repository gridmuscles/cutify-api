const { subMinutes } = require('date-fns')

let lastCronLaunchDateTime = subMinutes(new Date(), 15).toISOString()

module.exports = {
  newChatMessageNotification: {
    task: async ({ strapi }) => {
      strapi.log.info(
        `
        New message notifications cron job is started at
        ${new Date().toISOString()}
        `
      )

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

      strapi.log.info(
        `
        New message notifications were successfully sent for the following emails
        ${recipients.join(', ')}
        `
      )

      lastCronLaunchDateTime = new Date().toISOString()
      strapi.log.info(
        `Chat message notification cron job is finished at: ${lastCronLaunchDateTime}`
      )
    },
    options: {
      rule: '* */15 * * * *',
    },
  },
}
