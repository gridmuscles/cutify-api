const { ERROR_CODES } = require('../../src/utils/const')

const mockAuctionData = (data = {}) => {
  return {
    publishedAt: '2023-01-01 23:59:59',
    startDateTime: '2023-01-01 23:59:59',
    endDateTime: '2100-01-01 23:59:59',
    direction: 'desc',
    startPrice: 100,
    status: 'active',
    ...data,
  }
}

const createAuction = async (data = {}) => {
  if (!data.promotion) {
    throw new Error(ERROR_CODES.NO_REQUIRED_DYNAMIC_DATA)
  }

  return strapi.db.query('api::auction.auction').create({
    data: {
      ...mockAuctionData(data),
    },
  })
}

module.exports = {
  createAuction,
}
