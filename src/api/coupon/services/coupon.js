'use strict'

/**
 * coupon service
 */

const { createCoreService } = require('@strapi/strapi').factories

module.exports = createCoreService('api::coupon.coupon', () => ({
  async create(ctx) {
    ctx.data = {
      ...ctx.data,
      uuid: `${Math.floor(100000000 + Math.random() * 900000000)}-${Math.floor(
        200000000 + Math.random() * 800000000
      )}`,
    }

    return super.create(ctx)
  },

  async verifyAsManager({ uuidList, managerId }) {
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

    const organizationIds = locations.reduce((acc, location) => {
      return [...acc, location.organization.id]
    }, [])

    const couponsToVerify = await strapi.db
      .query('api::coupon.coupon')
      .findMany({
        where: {
          uuid: {
            $in: uuidList,
          },
          state: 'completed',
          promotion: {
            organization: { id: { $in: organizationIds } },
          },
        },
      })

    if (!couponsToVerify.length) {
      return { count: 0 }
    }

    return strapi.db.query('api::coupon.coupon').updateMany({
      where: {
        id: {
          $in: couponsToVerify.map(({ id }) => id),
        },
      },
      data: {
        state: 'verified',
      },
    })
  },
}))
