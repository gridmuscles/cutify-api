const qs = require('qs')

const getCouponListUrl = ({ host, locale, promotionId, uuidList }) => {
  const query = qs.stringify(
    {
      filters: {
        ...(promotionId ? { promotion: { id: promotionId } } : {}),
        uuid: {
          $in: uuidList,
        },
      },
    },

    {
      encodeValuesOnly: true,
    }
  )

  return `${host}/${locale}/coupons?${query}`
}

module.exports = {
  getCouponListUrl,
}
