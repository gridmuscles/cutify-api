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
      const sanitizedQueryParams = await this.sanitizeQuery(ctx)
      ctx.request.query = sanitizedQueryParams

      const { locale } = sanitizedQueryParams
      const { email, count } = ctx.request.body

      try {
        if (!email || !count) {
          throw new Error(ERROR_CODES.REQUIRED_FIELDS_MISSING)
        }

        const promotion = await strapi
          .service('api::promotion.promotion')
          .findOne(ctx)

        const { dateTimeUntil, publishedAt, auction } = promotion

        if (!publishedAt) {
          throw new Error(
            ERROR_CODES.UNABLE_TO_REQUEST_COUPON_FOR_DRAFT_PROMOTION
          )
        }

        if (auction) {
          throw new Error(
            ERROR_CODES.UNABLE_TO_REQUEST_COUPON_FOR_AUCTION_PROMOTION
          )
        }

        if (!dateTimeUntil) {
          throw new Error(ERROR_CODES.DATE_TIME_UNTIL_IS_NOT_DEFINED)
        }

        if (isAfter(new Date(), parseISO(dateTimeUntil))) {
          throw new Error(ERROR_CODES.PROMOTION_IS_FINISHED)
        }

        const { results: userCoupons } = await strapi
          .service('api::coupon.coupon')
          .find({
            filters: {
              email,
              promotion: promotion.id,
            },
          })

        if (userCoupons.length + count > 10) {
          throw new Error(ERROR_CODES.TOO_MANY_COUPONS_FOR_SINGLE_USER)
        }

        const couponUUIDList = await Promise.all(
          [...Array(count).keys()].map(() =>
            strapi.service('api::coupon.coupon').create({
              data: {
                promotion: promotion.id,
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
            discount: promotion.discount,
            promotionTitle: promotion.title,
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
        const sanitizedQueryParams = await this.sanitizeQuery(ctx)
        ctx.request.query = sanitizedQueryParams

        const promotion = await strapi
          .service('api::promotion.promotion')
          .findOne(ctx)

        if (!promotion) {
          return
        }

        const likesCount = promotion.likesCount ? promotion.likesCount + 1 : 1
        await strapi.service('api::promotion.promotion').update(promotion.id, {
          data: {
            likesCount,
          },
        })

        return {
          data: {
            likesCount,
          },
        }
      } catch (err) {
        strapi.log.error(err)
        ctx.badRequest()
      }
    },

    async findOne(ctx) {
      try {
        const sanitizedQueryParams = await this.sanitizeQuery(ctx)
        ctx.request.query = sanitizedQueryParams

        let promotion
        if (Number(ctx.params.id) != ctx.params.id) {
          promotion = await strapi
            .service('api::promotion.promotion')
            .findOneBySlug(ctx)
        } else {
          promotion = await strapi
            .service('api::promotion.promotion')
            .findOne(ctx)
        }
        if (!promotion) {
          throw new Error(ERROR_CODES.PROMOTION_NOT_FOUND)
        }
        const { views } = ctx.request.query
        await strapi.service('api::promotion.promotion').update(promotion.id, {
          data: {
            viewsCount:
              views === 'true'
                ? promotion.viewsCount + 1
                : promotion.viewsCount,
          },
        })

        const sanitizedResult = await this.sanitizeOutput(promotion, ctx)
        return this.transformResponse(sanitizedResult)
      } catch (err) {
        strapi.log.error(err)
        ctx.badRequest()
      }
    },

    async completeAuction(ctx) {
      try {
        const sanitizedQueryParams = await this.sanitizeQuery(ctx)
        ctx.request.query = sanitizedQueryParams

        const { locale } = ctx.request.query

        const promotion = await strapi
          .service('api::promotion.promotion')
          .findOne(ctx)

        await strapi.service('api::auction.auction').completeAuction({
          auctionId: promotion.auction.id,
        })

        const { id: userId, email: userEmail } = ctx.state.user

        const coupon = await strapi.service('api::coupon.coupon').create({
          data: {
            promotion: promotion.id,
            email: userEmail,
            user: userId,
            state: 'active',
          },
        })

        await strapi.plugins['email'].services.email.send(
          getCouponListEmail({
            discount: promotion.discount,
            promotionTitle: promotion.discount,
            email: userEmail,
            locale,
            origin: ctx.request.header.origin,
            couponUUIDList: [coupon.uuid],
          })
        )

        const { id } = coupon
        return { id }
      } catch (err) {
        strapi.log.error(err)
        ctx.badRequest()
      }
    },

    async createPromotionChat(ctx) {
      try {
        const { transformResponse: transformChatResponse } =
          await strapi.controller('api::chat.chat')
        const promotion = await strapi.entityService.findOne(
          'api::promotion.promotion',
          ctx.params.id,
          { populate: ['organization.id', 'organization.managers'] }
        )

        if (!promotion.isChatAvailable) {
          throw new Error()
        }

        const { results } = await strapi.service('api::chat.chat').find({
          filters: {
            promotion: promotion.id,
            users: {
              id: ctx.state.user.id,
            },
          },
        })

        if (results.length > 0) {
          throw new Error()
        }

        const newChat = await strapi.service('api::chat.chat').create({
          data: {
            promotion: promotion.id,
            users: [ctx.state.user.id],
          },
          populate: {
            promotion: true,
            messages: true,
            users: {
              fields: ['id, name'],
            },
          },
        })

        for (let manager of promotion.organization.managers) {
          const socket = strapi.io.socketMap?.get(manager.id)
          if (socket) {
            socket.join(`chat:${newChat.id}`)
          }
        }

        const userSocket = strapi.io.socketMap?.get(ctx.state.user.id)
        userSocket?.join(`chat:${newChat.id}`)
        userSocket
          ?.to(`chat:${newChat.id}`)
          .emit('receiveChatSuccess', transformChatResponse(newChat))

        try {
          await strapi.services['api::sms.sms'].sendSMS({
            phoneNumbers: promotion.organization.managers.map(
              ({ phone }) => phone
            ),
            body: 'Cappybara.com - There is a new chat created, please take a look!',
          })
        } catch (err) {
          strapi.log.error('SMS notification about the new chat was not sent')
        }

        return transformChatResponse(newChat)
      } catch (err) {
        strapi.log.error(err)
        ctx.badRequest()
      }
    },

    async findCoupons(ctx) {
      try {
        const {
          transformResponse: transformCouponResponse,
          sanitizeOutput: sanitizeCouponOutput,
        } = await strapi.controller('api::coupon.coupon')

        const { results, pagination } = await strapi
          .service('api::coupon.coupon')
          .find({
            filters: {
              promotion: {
                organization: {
                  managers: {
                    id: ctx.state.user.id,
                  },
                },
              },
            },
          })

        const sanitizedResults = await sanitizeCouponOutput(results, ctx)
        return transformCouponResponse(sanitizedResults, { pagination })
      } catch (err) {
        strapi.log.error(err)
        ctx.badRequest()
      }
    },
  })
)
