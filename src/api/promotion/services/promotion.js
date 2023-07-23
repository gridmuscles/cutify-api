'use strict'

const { snakeCase } = require('lodash')

/**
 * promotion service
 */

const { createCoreService } = require('@strapi/strapi').factories

module.exports = createCoreService('api::promotion.promotion', () => ({
  async findOneBySlug({ slug, query }) {
    const { filters, ...rest } = query

    const results = await strapi.entityService.findMany(
      'api::promotion.promotion',
      {
        filters: {
          slug,
          ...filters,
        },
        ...rest,
      }
    )

    return results[0] ?? null
  },

  async findRecommendations({ promotionId, query }) {
    const promotion = await strapi.entityService.findOne(
      'api::promotion.promotion',
      promotionId,
      {
        populate: ['categories'],
      }
    )

    const { filters, ...rest } = query

    return super.find({
      filters: {
        id: {
          $not: promotionId,
        },
        categories: {
          id: {
            $in: promotion.categories.map(({ id }) => id),
          },
        },
        ...(filters ?? {}),
      },
      ...rest,
    })
  },

  async findCategoriesTop({ pagination, sortBy, populate }) {
    const knex = strapi.db.connection
    const sortParam = snakeCase(sortBy)

    const result = await knex('promotions AS p')
      .select('p.id')
      .join(
        function () {
          this.select(
            'pcl.category_id',
            knex.raw(`MAX(p.${sortParam}) AS ${sortParam}`)
          )
            .from('promotions_categories_links AS pcl')
            .join('promotions AS p', 'pcl.promotion_id', 'p.id')
            .groupBy('pcl.category_id')
            .as('pmax')
        },
        `p.${sortParam}`,
        `pmax.${sortParam}`
      )
      .join('promotions_categories_links AS pcl', function () {
        this.on('p.id', 'pcl.promotion_id').andOn(
          `p.${sortParam}`,
          `pmax.${sortParam}`
        )
      })
      .distinct()

    return strapi.service('api::promotion.promotion').find({
      filters: {
        id: { $in: result.map(({ id }) => id) },
      },
      populate,
      pagination,
    })
  },

  async findSimilar({ promotionId, query }) {
    const promotion = await strapi.entityService.findOne(
      'api::promotion.promotion',
      promotionId,
      {
        populate: { categories: true },
      }
    )

    const { filters, ...rest } = query

    return super.find({
      filters: {
        id: {
          $not: promotionId,
        },
        categories: {
          id: {
            $in: promotion.categories.map(({ id }) => id),
          },
        },
        ...(filters ?? {}),
      },
      ...rest,
    })
  },

  async findByManager({ managerId, query }) {
    const locations = await strapi.entityService.findMany(
      'api::location.location',
      {
        filters: {
          managers: {
            id: managerId,
          },
        },
        populate: ['organization.promotions'],
      }
    )

    if (!locations[0]?.organization) {
      return { results: null }
    }

    const { filters, ...rest } = query

    return super.find({
      filters: {
        organization: {
          id: locations[0].organization.id,
        },
        ...filters,
      },
      ...rest,
    })
  },

  async getPromotionConfirmationCode({ promotionId, managerId }) {
    const locations = await strapi.entityService.findMany(
      'api::location.location',
      {
        filters: {
          managers: {
            id: managerId,
          },
        },
        populate: {
          organization: {
            populate: {
              promotions: true,
            },
          },
        },
      }
    )

    const promotion = locations[0]?.organization.promotions.find(
      (promotion) => promotion.id === Number(promotionId)
    )

    return promotion?.confirmationCode
  },

  async incrementPromotionViews({ promotionId }) {
    const promotion = await strapi.entityService.findOne(
      'api::promotion.promotion',
      promotionId
    )

    await strapi.entityService.update(
      'api::promotion.promotion',
      promotion.id,
      {
        data: {
          viewsCount: promotion.viewsCount + 1,
        },
      }
    )
  },
}))
