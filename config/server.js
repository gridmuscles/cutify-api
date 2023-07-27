const cronTasks = require('./cron-tasks')

module.exports = ({ env }) => ({
  host: env('HOST', '0.0.0.0'),
  port: env.int('PORT', 1337),
  app: {
    keys: env.array('APP_KEYS'),
    encryptionSecretKey: env('ENCRYPTION_SECRET_KEY'),
    encryptionSecretIv: env('ENCRYPTION_SECRET_IV'),
  },
  webhooks: {
    populateRelations: env.bool('WEBHOOKS_POPULATE_RELATIONS', false),
  },
  cron: {
    enabled: env.bool('ENABLE_CRON_TASKS', false),
    tasks: cronTasks,
  },
  sms: {
    enabled: env.bool('ENABLE_SMS', false),
    config: {
      provider: 'smsapi.pl',
      providerOptions: {
        authToken: env('SMS_AUTH_TOKEN'),
      },
    },
  },
  web: {
    host: env('WEB_APP_HOST'),
  },
  phone: {
    prefix: env('PUBLIC_PHONE_PREFIX'),
  },
  captcha: {
    enabled: env.bool('CAPTCHA_IS_ENABLED', false),
    id: env('CAPTCHA_PROJECT_ID'),
    apiKey: env('CAPTCHA_API_KEY'),
    key: env('CAPTCHA_KEY'),
  },
})
