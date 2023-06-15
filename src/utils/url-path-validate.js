const sanitizer = require('@braintree/sanitize-url')
const domainRegex =
  /^((http|https|ftp):\/\/)?[\w-]+(\.[\w-]+)+\.?(:\d+)?(\/\S*)?$/

const isValidUrlPath = (url) => {
  return !domainRegex.test(url) && sanitizer.sanitizeUrl(url.trim()) === url
}

module.exports = {
  isValidUrlPath,
}
