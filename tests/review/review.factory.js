const { ERROR_CODES } = require('../../src/utils/const')

const mockReviewData = (data = {}) => {
  const slugSuffix = Math.round(Math.random() * 10000).toString()
  return {
    name: `user${slugSuffix}`,
    message:
      'I wanted to take a moment to commend you on the excellent work you have been doing for our organization.',
    rating: 4,
    publishedAt: '2023-01-01 23:59:59',
    ...data,
  }
}

const createReview = async (data = {}) => {
  if (!data.organization) {
    throw new Error(ERROR_CODES.NO_REQUIRED_DYNAMIC_DATA)
  }

  return strapi.db.query('api::review.review').create({
    data: {
      ...mockReviewData(data),
    },
  })
}

module.exports = {
  createReview,
}
