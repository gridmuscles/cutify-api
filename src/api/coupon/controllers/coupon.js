'use strict'

/**
 * coupon controller
 */

const { createCoreController } = require('@strapi/strapi').factories

module.exports = createCoreController('api::coupon.coupon', () => ({
  async findByUuidList(ctx) {
    try {
      if (!ctx.request.query.filters?.uuid?.$in) {
        throw new Error()
      }
      return super.find(ctx)
    } catch (err) {
      strapi.log.error(err)
      ctx.badRequest(err.message, err.details)
    }
  },

  async verify(ctx) {
    try {
      const { ids } = ctx.request.body.data
      if (!ids) {
        throw new Error()
      }

      const coupon = await strapi.service('api::coupon.coupon').find({
        filters: {
          id: {
            $in: ids,
          },
          promotion: {
            id: coupon.promotion.id,
          },
        },
        populate: {
          promotion: {
            populate: {
              organization: {
                populate: {
                  managers: {
                    fields: ['id'],
                  },
                },
              },
            },
          },
        },
      })

      if (
        !coupon.promotion.organization.managers.some(
          ({ id }) => id === ctx.state.user.id
        ) ||
        coupon.state === 'verified'
      ) {
        throw new Error()
      }

      await strapi.service('api::coupon.coupon').verify(ctx)
      return true
    } catch (err) {
      strapi.log.error(err)
      ctx.badRequest(err.message, err.details)
    }
  },
}))
