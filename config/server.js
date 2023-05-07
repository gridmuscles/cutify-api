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
})
