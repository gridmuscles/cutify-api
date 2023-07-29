const request = require('supertest')
const { JEST_TIMEOUT } = require('./../helpers')
const { setupStrapi, stopStrapi } = require('./../helpers/strapi')

const { createUser } = require('../user/user.factory')
const { createCoupon } = require('../coupon/coupon.factory')
const { getReportById } = require('../report/report.factory')

jest.setTimeout(JEST_TIMEOUT)

beforeAll(async () => {
  await setupStrapi()
})

afterAll(async () => {
  await stopStrapi()
})

describe('Receipt', () => {
  it.each([
    { type: 'public', code: 200 },
    { type: 'authenticated', code: 200 },
    { type: 'manager', code: 200 },
    { type: 'moderator', code: 200 },
  ])(
    'should $type user have a code $code to create report',
    async ({ type, code }) => {
      const emailSendMock = (strapi.plugin('email').service('email').send = jest
        .fn()
        .mockReturnValue({ id: 1 }))

      const [, jwt] = await createUser({ type })

      const req = request(strapi.server.httpServer)
        .post(`/api/reports`)
        .set('accept', 'application/json')
        .set('Content-Type', 'application/json')
        .send({
          data: {
            data: {},
          },
        })

      if (jwt) {
        req.set('Authorization', `Bearer ${jwt}`)
      }

      await req.expect('Content-Type', /json/).expect(code)

      expect(emailSendMock).toBeCalledTimes(1)
    }
  )

  it('should user be able to send report and attach coupons', async () => {
    const coupon1 = await createCoupon()
    const coupon2 = await createCoupon()

    const emailSendMock = (strapi.plugin('email').service('email').send = jest
      .fn()
      .mockReturnValue({ id: 1 }))

    const report = await request(strapi.server.httpServer)
      .post(`/api/reports?populate=*`)
      .set('accept', 'application/json')
      .set('Content-Type', 'application/json')
      .send({
        data: {
          coupons: [coupon1.uuid, coupon2.uuid],
        },
      })
      .expect('Content-Type', /json/)
      .expect(200)
      .then(({ body: { data } }) => data)

    const populatedReport = await getReportById(report.id)
    expect(populatedReport.coupons).toHaveLength(2)

    expect(emailSendMock).toBeCalledTimes(1)
  })
})
