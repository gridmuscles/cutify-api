const updatePromotionCouponsCount = async (
  { promotionId, couponsCount },
  strapi
) => {
  return strapi.db.transaction(async () => {
    if (promotionId) {
      const promotion = await strapi.query('api::promotion.promotion').findOne({
        where: { id: promotionId },
      })
      await strapi.query('api::promotion.promotion').update({
        where: { id: promotionId },
        data: {
          couponsCount: promotion.couponsCount + couponsCount,
        },
      })
    }
  })
}

module.exports = {
  afterCreate: async ({ params }) => {
    const promotionId =
      params.data.promotion ?? params.data.promotion?.connect[0]?.id
    if (promotionId) {
      await updatePromotionCouponsCount(
        { promotionId, couponsCount: 1 },
        strapi
      )
    }
  },

  afterCreateMany: async ({ params }) => {
    const promotionId = params.data[0]?.promotion
    if (promotionId) {
      await updatePromotionCouponsCount(
        { promotionId, couponsCount: params.data.length },
        strapi
      )
    }
  },
}
