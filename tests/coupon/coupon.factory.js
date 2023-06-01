const mockCouponData = (data = {}) => {
  const slugSuffix = Math.round(Math.random() * 10000).toString()
  return {
    uuid: `${slugSuffix}`,
    email: `${slugSuffix}@test.com`,
    state: 'active',
    ...data,
  }
}

const createCoupon = async (data = {}) => {
  return strapi.db.query('api::coupon.coupon').create({
    data: {
      promotion: data.promotion,
      ...mockCouponData(data),
    },
  })
}

const clearCoupons = () => {
  return strapi.db.query('api::coupon.coupon').deleteMany()
}

module.exports = {
  mockCouponData,
  createCoupon,
  clearCoupons,
}
