const { ERROR_CODES } = require('../../src/utils/const')

const mockBidData = (data = {}) => {
  return {
    amount: 100,
    ...data,
  }
}

const createBid = async (data = {}) => {
  if (!data.bidder || !data.auction) {
    throw new Error(ERROR_CODES.NO_REQUIRED_DYNAMIC_DATA)
  }

  return strapi.db.query('api::bid.bid').create({
    data: {
      ...mockBidData(data),
    },
  })
}

const clearBids = () => {
  return strapi.db.query('api::bid.bid').deleteMany()
}

module.exports = {
  createBid,
  clearBids,
}
