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
    const { populate } = ctx.request.query

    const { results } = await this.find({
      filters: {
        id: ctx.params.id,
      },
      populate,
      publicationState: 'preview',
    })
    return results[0]
  },

  async findOneBySlug(ctx) {
    const { populate } = ctx.request.query

    const { results } = await this.find({
      filters: {
        slug: ctx.params.id,
      },
      populate,
    })
    return results[0]
  },

  async getPromotionCouponsCount({ promotionId }) {
    const {
      pagination: { total },
    } = await strapi.service('api::coupon.coupon').find({
      fields: ['id'],
      filters: { promotion: promotionId },
    })

    return total
  },

  async findRecommendations({ promotionId, populate }) {
    const promotion = await strapi.entityService.findOne(
      'api::promotion.promotion',
      promotionId,
      {
        populate: { categories: true },
      }
    )

    return strapi.entityService.findMany('api::promotion.promotion', {
      filters: {
        id: {
          $not: promotionId,
        },

        categories: {
          id: {
            $in: promotion.categories.map(({ id }) => id),
          },
        },
      },
      populate,
    })
  },

  async findSimilar({ promotionId, populate }) {
    const promotion = await strapi.entityService.findOne(
      'api::promotion.promotion',
      promotionId,
      {
        populate: { category: true },
      }
    )

    return strapi.entityService.findMany('api::promotion.promotion', {
      filters: {
        id: {
          $not: promotionId,
        },

        categories: {
          id: {
            $in: promotion.categories.map(({ id }) => id),
          },
        },
      },
      populate,
    })
  },
}))
