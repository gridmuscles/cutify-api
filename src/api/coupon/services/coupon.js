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
          organization: {
            id: {
              $notNull: true,
            },
          },
        },
        populate: {
          organization: true,
        },
      }
    )

    if (!locations.length) {
      throw new Error()
    }

    const organization = locations[0].organization

    if (
      locations.some((location) => location.organization.id !== organization.id)
    ) {
      throw new Error()
    }

    const coupons = await strapi.db.query('api::coupon.coupon').findMany({
      where: {
        uuid: {
          $in: uuidList,
        },
        state: 'active',
        promotion: {
          organization: { id: organization.id },
        },
      },
    })

    if (coupons.length !== uuidList.length) {
      throw new Error()
    }

    return this.verifyCouponList({ uuidList })
  },

  async verifyWithCode({ uuidList, code }) {
    const coupons = await strapi.entityService.findMany('api::coupon.coupon', {
      filters: {
        state: 'active',
        uuid: {
          $in: uuidList,
        },
        promotion: {
          id: {
            $notNull: true,
          },
        },
      },
      populate: {
        promotion: true,
      },
    })

    if (coupons.length !== uuidList.length) {
      throw new Error()
    }

    const promotion = coupons[0].promotion
    if (coupons.some((coupon) => coupon.promotion.id !== promotion.id)) {
      throw new Error()
    }

    if (promotion.confirmationCode !== code) {
      throw new Error()
    }

    return this.verifyCouponList({ uuidList })
  },

  async verifyCouponList({ uuidList, receiptId }) {
    await strapi.db.query('api::coupon.coupon').updateMany({
      where: {
        id: {
          $in: uuidList,
        },
      },
      data: {
        state: 'verified',
        receipt: receiptId,
      },
    })
  },
}))
