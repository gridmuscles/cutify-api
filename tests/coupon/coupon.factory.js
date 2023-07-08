const mockCouponData = (data = {}) => {
  const slugSuffix = Math.round(Math.random() * 10000).toString()
  return {
    uuid: `${slugSuffix}`,
    email: `${slugSuffix}@test.com`,
    state: 'active',
    dateTimeUntil: '2100-04-30 23:59:59',
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

const getCouponById = async ({ id }) => {
  return strapi.db.query('api::coupon.coupon').findOne({
    where: {
      id,
    },
    populate: {
      receipt: true,
    },
  })
}

const getCouponByUuid = async ({ uuid }) => {
  return strapi.db.query('api::coupon.coupon').findOne({
    where: {
      uuid,
    },
    populate: {
      receipt: true,
      promotion: true,
      user: true,
    },
  })
}

const clearCoupons = () => {
  return strapi.db.query('api::coupon.coupon').deleteMany()
}

module.exports = {
  mockCouponData,
  createCoupon,
  getCouponById,
  getCouponByUuid,
  clearCoupons,
}
