'use strict'

/**
 * reservation controller
 */
const { ValidationError, ForbiddenError } = require('@strapi/utils').errors
const { createCoreController } = require('@strapi/strapi').factories

const { ERROR_CODES } = require('../../../utils/const')

module.exports = createCoreController('api::reservation.reservation', () => ({
  async find(ctx) {
    const reservations = await super.find(ctx)

    reservations.data = reservations.data.map((reservation) => {
      if (reservation.attributes.user.data.id === ctx.state.user.id) {
        return reservation
      }

      return {
        ...reservation,
        attributes: {
          ...reservation.attributes,
          comment: undefined,
          user: undefined,
        },
      }
    })

    return reservations
  },

  async findOne(ctx) {
    const reservation = await super.findOne(ctx)

    if (reservation.data.attributes.user.data.id !== ctx.state.user.id) {
      throw new ForbiddenError()
    }

    return reservation
  },

  async create(ctx) {
    try {
      const {
        data: { user, dateTimeFrom, dateTimeTo, organization, service, target },
      } = ctx.request.body

      if (user) {
        throw new ValidationError(ERROR_CODES.PROHIBITED_PROPERTY)
      }

      const reservationService = await strapi.entityService.findOne(
        'api::reservation-service.reservation-service',
        service,
        { populate: ['organization.id', 'targets'] }
      )
      const reservationTarget = await strapi.entityService.findOne(
        'api::reservation-target.reservation-target',
        target,
        { populate: ['organization.id', 'services'] }
      )

      if (reservationService.organization.id !== organization) {
        throw new ValidationError(
          ERROR_CODES.SERVICE_BELONGS_ANOTHER_ORGANIZATION
        )
      }

      if (reservationTarget.organization.id !== organization) {
        throw new ValidationError(
          ERROR_CODES.TARGET_BELONGS_ANOTHER_ORGANIZATION
        )
      }

      if (
        !reservationService.targets.some(
          (target) => target.id === reservationTarget.id
        ) ||
        !reservationTarget.services.some(
          (service) => service.id === reservationService.id
        )
      ) {
        throw new ValidationError(
          ERROR_CODES.TARGET_AND_SERVICE_ARE_NOT_RELATED
        )
      }

      const overlapReservations = await strapi.entityService.findMany(
        'api::reservation.reservation',
        {
          filters: {
            dateTimeFrom: {
              $lt: new Date(dateTimeTo),
            },
            dateTimeTo: {
              $gt: new Date(dateTimeFrom),
            },
          },
        }
      )

      if (overlapReservations.length > 0) {
        throw new ValidationError(ERROR_CODES.OVERLAP_RESERVATION)
      }

      ctx.request.body.data.user = ctx.state.user.id
      return super.create(ctx)
    } catch (err) {
      strapi.log.error(err)
      ctx.badRequest()
    }
  },
}))
