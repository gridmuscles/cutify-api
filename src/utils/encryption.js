const crypto = require('crypto')

const init = async ({ strapi }) => {
  const {
    app: { encryptionSecretKey },
  } = strapi.config.get('server')

  if (!encryptionSecretKey) {
    throw new Error('secretKey is required for crypto')
  }

  const SECRET = encryptionSecretKey
  const ALGORITHM = 'aes-256-cbc'

  function encrypt(text) {
    let iv = crypto.randomBytes(16)
    let cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(SECRET), iv)
    let encrypted = cipher.update(text)

    encrypted = Buffer.concat([encrypted, cipher.final()])

    return iv.toString('hex') + ':' + encrypted.toString('hex')
  }

  function decrypt(text) {
    let textParts = text.split(':')
    let iv = Buffer.from(textParts.shift(), 'hex')
    let encryptedText = Buffer.from(textParts.join(':'), 'hex')
    let decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(SECRET), iv)
    let decrypted = decipher.update(encryptedText)

    decrypted = Buffer.concat([decrypted, decipher.final()])

    return decrypted.toString()
  }

  strapi.encrypt = encrypt
  strapi.decrypt = decrypt
}

module.exports = {
  init,
}
