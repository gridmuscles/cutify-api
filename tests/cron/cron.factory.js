const getNewChatMessageNotification = async () => {
  const { cron } = strapi.config.get('server')
  return cron.tasks.newChatMessageNotification.task
}

module.exports = {
  getNewChatMessageNotification,
}
