module.exports = ({ env }) => ({
  auth: {
    secret: env('ADMIN_JWT_SECRET'),
  },
  apiToken: {
    salt: env('API_TOKEN_SALT'),
  },
  transfer: {
    token: {
      salt: env('TRANSFER_TOKEN_SALT'),
    },
  },
  watchIgnoreFiles: ['**/config/sync/**'],
  forgotPassword: {
    title: env('EMAIL_APP_TITLE'),
    from: env('EMAIL_FROM'),
    replyTo: env('EMAIL_REPLY_TO'),
    resetPasswordUrl: env('RESET_PASSWORD_URL'),
  },
})
