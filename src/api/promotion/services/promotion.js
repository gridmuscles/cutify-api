'use strict'

/**
 * promotion service
 */

const { createCoreService } = require('@strapi/strapi').factories

module.exports = createCoreService('api::promotion.promotion', () => ({
  async find(ctx) {
    const { results, pagination } = await super.find(ctx)

    const coupons = await Promise.all(
      results.map(async ({ id }) =>
        this.getPromotionCouponsCount({ promotionId: id })
      )
    )

    return {
      results: results.map((promotion, i) => ({
        ...promotion,
        couponsCount: coupons[i],
      })),
      pagination,
    }
  },

  async findOne(ctx) {
    const { results } = await this.find({
      filters: {
        id: ctx.params.id,
      },
      publicationState: 'preview',
    })
    return results[0]
  },

  async findOneBySlug(ctx) {
    const { results } = await this.find({
      ...ctx.request.query,
      filters: {
        slug: ctx.params.id,
      },
    })
    return results[0]
  },

  async getPromotionCouponsCount({ promotionId }) {
    const { results } = await strapi.service('api::coupon.coupon').find({
      fields: ['id'],
      filters: { promotion: promotionId },
    })

    return results.length
  },
}))
