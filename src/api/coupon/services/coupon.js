'use strict'

/**
 * coupon service
 */

const { createCoreService } = require('@strapi/strapi').factories

const PDFDocument = require('pdfkit')
const QRCode = require('qrcode')
const qs = require('qs')

const { translateEntity } = require('../../../utils/translate-entity.js')

const addCouponPageToDoc = async ({
  doc,
  origin,
  locale,

  coupon,
  terms,
}) => {
  const query = qs.stringify(
    {
      filters: {
        uuid: {
          $in: coupon.uuid,
        },
      },
    },
    {
      encodeValuesOnly: true,
    }
  )

  const qr = await QRCode.toDataURL(`${origin}/${locale}/coupons?${query}`)

  doc
    .rect(doc.x - 10, doc.y - 10, doc.page.width - 30, doc.page.height - 50)
    .stroke()

  const linePosition = doc.y

  switch (coupon.state) {
    case 'active':
      doc.fontSize(12).text(terms.stateActive, {
        align: 'right',
        x: 0,
        y: linePosition,
      })
      break
    case 'verified':
      doc.fontSize(12).text(terms.stateVerified, {
        align: 'right',
        x: 0,
        y: linePosition,
      })
      break
    case 'expired':
      doc.fontSize(12).text(terms.stateExpired, {
        align: 'right',
        x: 0,
        y: linePosition,
      })
      break
    default:
      doc.fontSize(12).text('-')
  }

  doc.fontSize(16).text(`# ${coupon.uuid}`, {
    x: 0,
    y: linePosition,
  })

  doc.image(qr, { fit: [125, 125] })

  doc
    .fontSize(10)
    .text(terms.title, {
      align: 'left',
    })
    .text(terms.description)

  doc
    .fontSize(9)
    .text('Cappybara.com', doc.page.width - 100, doc.page.height - 25, {
      lineBreak: false,
    })
}

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

  async generateCouponListPdf({ uuidList, locale, origin }) {
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

    const terms = await strapi.entityService.findMany(
      'api::coupon-terms.coupon-terms'
    )
    const translatedTerms = translateEntity(terms, locale)
    const translatedCoupons = translateEntity(coupons, locale)

    const [firstCoupon, ...otherCoupons] = translatedCoupons
    const doc = new PDFDocument({ size: 'A5', margin: 25 })
    doc.font('src/api/coupon/assets/NotoSans-Medium.ttf')

    await addCouponPageToDoc({
      doc,
      origin,
      locale,
      coupon: firstCoupon,
      terms: translatedTerms,
    })

    for (let coupon of otherCoupons) {
      doc.addPage()

      await addCouponPageToDoc({
        doc,
        origin,
        locale,

        coupon,
        terms: translatedTerms,
      })
    }

    doc.end()
    return doc
  },
}))
