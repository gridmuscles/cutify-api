const crypto = require('crypto')

const init = async ({ strapi }) => {
  const {
    app: { encryptionSecretKey, encryptionSecretIv },
  } = strapi.config.get('server')

  if (!encryptionSecretKey || !encryptionSecretIv) {
    throw new Error('secretKey, secretIV, and encryptionMethod are required')
  }

  const key = crypto
    .createHash('sha512')
    .update(encryptionSecretKey)
    .digest('hex')
    .substring(0, 32)
  const encryptionIV = crypto
    .createHash('sha512')
    .update(encryptionSecretIv)
    .digest('hex')
    .substring(0, 16)
  const encryptionMethod = 'aes-256-cbc'

  function encrypt(data) {
    const cipher = crypto.createCipheriv(encryptionMethod, key, encryptionIV)
    return Buffer.from(
      cipher.update(data, 'utf8', 'hex') + cipher.final('hex')
    ).toString('base64')
  }

  function decrypt(data) {
    const buff = Buffer.from(data, 'base64')
    const decipher = crypto.createDecipheriv(
      encryptionMethod,
      key,
      encryptionIV
    )
    return (
      decipher.update(buff.toString('utf8'), 'hex', 'utf8') +
      decipher.final('utf8')
    )
  }

  strapi.encrypt = encrypt
  strapi.decrypt = decrypt
}

module.exports = {
  init,
}
