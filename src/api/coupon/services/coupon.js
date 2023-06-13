'use strict'

/**
 * coupon service
 */

const { createCoreService } = require('@strapi/strapi').factories

const { getCouponListPdf } = require('../../../utils/get-coupon-list-pdf.js')
const { translateEntity } = require('../../../utils/translate-entity.js')

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
          promotion: {
            dateTimeUntil: {
              $gte: new Date().toISOString(),
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
          dateTimeUntil: {
            $gte: new Date().toISOString(),
          },
          confirmationCode: code,
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

    return this.verifyCouponList({ uuidList })
  },

  async verifyWithReceipt({ uuidList, receipt }) {
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
          dateTimeUntil: {
            $gte: new Date().toISOString(),
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

    await this.verifyCouponList({ uuidList })

    await strapi.entityService.update('api::receipt.receipt', receipt.id, {
      data: {
        coupons: coupons.map((coupon) => coupon.id),
      },
    })
  },

  async verifyCouponList({ uuidList, receiptId }) {
    await strapi.db.query('api::coupon.coupon').updateMany({
      where: {
        uuid: {
          $in: uuidList,
        },
      },
      data: {
        state: 'verified',
        receipt: receiptId,
      },
    })
  },

  async generateCouponListPdf({ uuidList, origin, locale }) {
    const coupons = await strapi.entityService.findMany('api::coupon.coupon', {
      filters: {
        uuid: { $in: uuidList },
      },
      populate: {
        promotion: true,
      },
    })

    if (!coupons.length) {
      throw new Error()
    }

    const { coupon } = await strapi.entityService.findMany(
      'api::static-pages.static-pages',
      {
        filters: {
          slug: 'coupon',
        },
        populate: {
          coupon: true,
        },
      }
    )

    const translatedTerms = translateEntity(coupon, locale)
    const translatedCoupons = translateEntity(coupons, locale)

    return getCouponListPdf({
      coupons: translatedCoupons,
      terms: translatedTerms,
      origin,
      locale,
    })
  },
}))
