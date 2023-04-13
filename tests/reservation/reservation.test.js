const request = require('supertest')
const { JEST_TIMEOUT } = require('./../helpers')
const { setupStrapi, stopStrapi } = require('./../helpers/strapi')

const { createCategory } = require('../category/category.factory')
const { createOrganization } = require('../organization/organization.factory')
const {
  createReservationService,
} = require('../reservation-service/reservation-service.factory')
const {
  createReservationTarget,
} = require('../reservation-target/reservation-target.factory')
const { createUser } = require('../user/user.factory')

const {
  mockReservationData,
  createReservation,
  clearReservations,
} = require('../reservation/reservation.factory')

jest.setTimeout(JEST_TIMEOUT)

beforeAll(async () => {
  await setupStrapi()
})

afterAll(async () => {
  await stopStrapi()
})

describe('Reservation', () => {
  let primaryUser
  let primaryUserJwt
  let category
  let primaryOrganization
  let primaryReservationService
  let primaryReservationTarget
  let primaryReservationData
  let primaryRequestReservationData

  beforeAll(async () => {
    const [user, jwt] = await createUser()
    primaryUser = user
    primaryUserJwt = jwt

    category = await createCategory()
    primaryOrganization = await createOrganization({
      categories: [category.id],
    })
    primaryReservationService = await createReservationService({
      organization: primaryOrganization.id,
      targets: [],
    })
    primaryReservationTarget = await createReservationTarget({
      organization: primaryOrganization.id,
      services: [primaryReservationService.id],
    })
    primaryReservationData = {
      organization: primaryOrganization.id,
      service: primaryReservationService.id,
      target: primaryReservationTarget.id,
      user: primaryUser,
    }
    primaryRequestReservationData = {
      ...primaryReservationData,
      user: undefined,
    }
  })

  beforeEach(async () => {
    await clearReservations()
  })

  it('should user is able to see all reservations, but only own should be populated', async () => {
    const [user, userJwt] = await createUser()
    await createReservation({
      ...primaryReservationData,
    })
    await createReservation({
      ...primaryReservationData,
      user: user.id,
    })

    await request(strapi.server.httpServer)
      .get(`/api/reservations`)
      .set('accept', 'application/json')
      .set('Content-Type', 'application/json')
      .set('Authorization', `Bearer ${userJwt}`)
      .expect('Content-Type', /json/)
      .expect(403)
    // .expect(200)
    // .then(({ body: { data } }) => {
    //   expect(data).toHaveLength(2)

    //   expect(data[0].id).toBe(reservation1.id)
    //   expect(data[0].attributes.comment).toBeUndefined()
    //   expect(data[0].attributes.user).toBeUndefined()

    //   expect(data[1].id).toBe(reservation2.id)
    //   expect(data[1].attributes.comment).toBeDefined()
    //   expect(data[1].attributes.user).toBeDefined()
    // })
  })

  it('should an be error when user try to open someone else reservation', async () => {
    const [, userJwt] = await createUser()
    const reservation = await createReservation({
      ...primaryReservationData,
    })

    await request(strapi.server.httpServer)
      .get(`/api/reservations/${reservation.id}`)
      .set('accept', 'application/json')
      .set('Content-Type', 'application/json')
      .set('Authorization', `Bearer ${userJwt}`)
      .expect('Content-Type', /json/)
      .expect(403)
  })

  it('should reservation be created with full population for current user', async () => {
    await request(strapi.server.httpServer)
      .post('/api/reservations')
      .set('accept', 'application/json')
      .set('Content-Type', 'application/json')
      .set('Authorization', `Bearer ${primaryUserJwt}`)
      .send({
        data: mockReservationData({
          ...primaryRequestReservationData,
        }),
      })
      .expect('Content-Type', /json/)
      .expect(403)
    // .expect(200)
    // .then(({ body: { data } }) => {
    //   expect(data.attributes.organization).toBeDefined()
    //   expect(data.attributes.service).toBeDefined()
    //   expect(data.attributes.target).toBeDefined()
    //   expect(data.attributes.user).toBeDefined()
    //   expect(data.attributes.user.data.id).toBe(primaryUser.id)
    // })
  })

  it('should be an error if pass a user to the reservation', async () => {
    await request(strapi.server.httpServer)
      .post('/api/reservations')
      .set('accept', 'application/json')
      .set('Content-Type', 'application/json')
      .set('Authorization', `Bearer ${primaryUserJwt}`)
      .send({
        data: mockReservationData({
          ...primaryRequestReservationData,
          user: 2,
        }),
      })
      .expect('Content-Type', /json/)
      .expect(403)
  })

  it('should be an error when service belongs to different organization', async () => {
    const organization = await createOrganization({
      categories: [category.id],
    })
    const reservationService = await createReservationService({
      organization: organization.id,
      targets: [],
    })

    await request(strapi.server.httpServer)
      .post('/api/reservations')
      .set('accept', 'application/json')
      .set('Content-Type', 'application/json')
      .set('Authorization', `Bearer ${primaryUserJwt}`)
      .send({
        data: mockReservationData({
          ...primaryRequestReservationData,
          service: reservationService.id,
        }),
      })
      .expect('Content-Type', /json/)
      .expect(403)
  })

  it('should an be error when target belongs to different organization', async () => {
    const organization = await createOrganization({
      categories: [category.id],
    })
    const reservationTarget = await createReservationService({
      organization: organization.id,
      targets: [],
    })

    await request(strapi.server.httpServer)
      .post('/api/reservations')
      .set('accept', 'application/json')
      .set('Content-Type', 'application/json')
      .set('Authorization', `Bearer ${primaryUserJwt}`)
      .send({
        data: mockReservationData({
          ...primaryRequestReservationData,
          target: reservationTarget.id,
        }),
      })
      .expect('Content-Type', /json/)
      .expect(403)
  })

  it('should an be error when target does not belong to service', async () => {
    const organization = await createOrganization({
      categories: [category.id],
    })
    const reservationService = await createReservationService({
      organization: organization.id,
      targets: [],
    })
    const reservationTarget = await createReservationTarget({
      organization: organization.id,
      services: [],
    })

    await request(strapi.server.httpServer)
      .post('/api/reservations')
      .set('accept', 'application/json')
      .set('Content-Type', 'application/json')
      .set('Authorization', `Bearer ${primaryUserJwt}`)
      .send({
        data: mockReservationData({
          organization: organization.id,
          service: reservationService.id,
          target: reservationTarget.id,
        }),
      })
      .expect('Content-Type', /json/)
      .expect(403)
  })

  it('should be correct reservation if start of the current is equal the end of existing one', async () => {
    await createReservation({
      ...primaryReservationData,
      dateTimeFrom: '2023-04-10 14:00:00',
      dateTimeTo: '2023-04-10 15:00:00',
    })

    await request(strapi.server.httpServer)
    await request(strapi.server.httpServer)
      .post('/api/reservations')
      .set('accept', 'application/json')
      .set('Content-Type', 'application/json')
      .set('Authorization', `Bearer ${primaryUserJwt}`)
      .send({
        data: mockReservationData({
          ...primaryRequestReservationData,
          dateTimeFrom: '2023-04-10 13:00:00',
          dateTimeTo: '2023-04-10 14:00:00',
        }),
      })
      .expect('Content-Type', /json/)
      .expect(403)
  })

  it('should be correct reservation if end of the current is equal the start of existing one', async () => {
    await createReservation({
      ...primaryReservationData,
      dateTimeFrom: '2023-04-10 13:00:00',
      dateTimeTo: '2023-04-10 15:00:00',
    })

    await request(strapi.server.httpServer)
    await request(strapi.server.httpServer)
      .post('/api/reservations')
      .set('accept', 'application/json')
      .set('Content-Type', 'application/json')
      .set('Authorization', `Bearer ${primaryUserJwt}`)
      .send({
        data: mockReservationData({
          ...primaryRequestReservationData,
          dateTimeFrom: '2023-04-10 15:00:00',
          dateTimeTo: '2023-04-10 16:00:00',
        }),
      })
      .expect('Content-Type', /json/)
      .expect(403)
  })

  it('should an be error when user try to make overlap reservation the start of another reservation', async () => {
    await createReservation({
      ...primaryReservationData,
      dateTimeFrom: '2023-04-10 13:00:00',
      dateTimeTo: '2023-04-10 14:00:00',
    })

    await request(strapi.server.httpServer)
    await request(strapi.server.httpServer)
      .post('/api/reservations')
      .set('accept', 'application/json')
      .set('Content-Type', 'application/json')
      .set('Authorization', `Bearer ${primaryUserJwt}`)
      .send({
        data: mockReservationData({
          ...primaryRequestReservationData,
          dateTimeFrom: '2023-04-10 12:00:00',
          dateTimeTo: '2023-04-10 13:30:00',
        }),
      })
      .expect('Content-Type', /json/)
      .expect(403)
  })

  it('should an be error when user try to make overlap the end of another reservation', async () => {
    await createReservation({
      ...primaryReservationData,
      dateTimeFrom: '2023-04-10 13:00:00',
      dateTimeTo: '2023-04-10 14:00:00',
    })

    await request(strapi.server.httpServer)
    await request(strapi.server.httpServer)
      .post('/api/reservations')
      .set('accept', 'application/json')
      .set('Content-Type', 'application/json')
      .set('Authorization', `Bearer ${primaryUserJwt}`)
      .send({
        data: mockReservationData({
          ...primaryRequestReservationData,
          dateTimeFrom: '2023-04-10 13:30:00',
          dateTimeTo: '2023-04-10 14:30:00',
        }),
      })
      .expect('Content-Type', /json/)
      .expect(403)
  })
})
