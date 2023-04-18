'use strict'

const { parseISO, isAfter } = require('date-fns')
const { ERROR_CODES } = require('../../../utils/const')
const { getCouponListEmail } = require('../../../utils/email')

/**
 * promotion controller
 */

const { createCoreController } = require('@strapi/strapi').factories

//TODO (Tests)
module.exports = createCoreController(
  'api::promotion.promotion',
  ({ strapi }) => ({
    async requestCoupon(ctx) {
      const { locale } = ctx.request.query
      const { email, count } = ctx.request.body

      try {
        if (!email || !count) {
          throw new Error(ERROR_CODES.REQUIRED_FIELDS_MISSING)
        }

        const promotion = await super.findOne(ctx)
        const { dateTimeUntil, publishedAt, couponsLimit } =
          promotion.data.attributes

        if (!publishedAt) {
          throw new Error(
            ERROR_CODES.UNABLE_TO_REQUEST_COUPON_FOR_DRAFT_PROMOTION
          )
        }

        if (couponsLimit === 0) {
          throw new Error(ERROR_CODES.COUPON_LIMIT_EXCEEDED)
        }

        if (!dateTimeUntil) {
          throw new Error(ERROR_CODES.DATE_TIME_UNTIL_IS_NOT_DEFINED)
        }

        if (isAfter(new Date(), parseISO(dateTimeUntil))) {
          throw new Error(ERROR_CODES.PROMOTION_IS_FINISHED)
        }

        const userCoupons = await strapi.entityService.findMany(
          'api::coupon.coupon',
          {
            filters: {
              email,
              promotion: promotion.data.id,
            },
          }
        )

        if (userCoupons.length + count > 10) {
          throw new Error(ERROR_CODES.TOO_MANY_COUPONS_FOR_SINGLE_USER)
        }

        const couponUUIDList = await Promise.all(
          [...Array(count).keys()].map(() =>
            strapi.entityService.create('api::coupon.coupon', {
              data: {
                promotion: promotion.data.id,
                email,
                uuid: `${Math.floor(
                  100000000 + Math.random() * 900000000
                )}-${Math.floor(200000000 + Math.random() * 800000000)}`,
                state: 'active',
              },
            })
          )
        ).then((coupons) => coupons.map(({ uuid }) => uuid))

        await strapi.plugins['email'].services.email.send(
          getCouponListEmail({
            email,
            locale,
            origin: ctx.request.header.origin,
            couponUUIDList,
          })
        )

        return { data: couponUUIDList }
      } catch (err) {
        strapi.log.error(err)
        ctx.badRequest()
      }
    },

    async like(ctx) {
      try {
        const promotion = await strapi.entityService.findOne(
          'api::promotion.promotion',
          ctx.params.id
        )

        if (!promotion) {
          return
        }

        await strapi.entityService.update(
          'api::promotion.promotion',
          promotion.id,
          {
            data: {
              likesCount: promotion.likesCount ? promotion.likesCount + 1 : 1,
            },
          }
        )

        return {}
      } catch (err) {
        strapi.log.error(err)
        ctx.badRequest()
      }
    },

    async find(ctx) {
      const { data, meta } = await super.find(ctx)

      const coupons = await Promise.all(
        data.map(async ({ id }) => {
          const coupons = await strapi.entityService.findMany(
            'api::coupon.coupon',
            {
              fields: ['id'],
              filters: { promotion: id },
            }
          )

          return coupons.length
        })
      )

      return {
        data: data.map((promotion, i) => ({
          ...promotion,
          attributes: {
            ...promotion.attributes,
            couponsCount: coupons[i],
          },
        })),

        meta,
      }
    },

    async findOne(ctx) {
      try {
        ctx.request.query.filters = {
          slug: {
            $eq: ctx.params.id,
          },
        }

        let promotion
        if (Number(ctx.params.id) != ctx.params.id) {
          promotion = (await this.find(ctx)).data[0]
        } else {
          promotion = (await super.findOne(ctx)).data
        }

        if (!promotion) {
          throw new Error(ERROR_CODES.PROMOTION_NOT_FOUND)
        }

        const { views } = ctx.request.query
        await strapi.entityService.update(
          'api::promotion.promotion',
          promotion.id,
          {
            data: {
              viewsCount:
                views === 'true'
                  ? promotion.attributes.viewsCount + 1
                  : promotion.attributes.viewsCount,
            },
          }
        )

        return { data: promotion }
      } catch (err) {
        strapi.log.error(err)
        ctx.badRequest()
      }
    },
  })
)
