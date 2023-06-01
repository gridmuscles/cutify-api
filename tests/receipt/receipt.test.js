const fs = require('fs')
const path = require('path')
const FormData = require('form-data')

const request = require('supertest')
const { JEST_TIMEOUT } = require('./../helpers')
const { setupStrapi, stopStrapi } = require('./../helpers/strapi')

const { createCoupon } = require('../coupon/coupon.factory')
const { createUser } = require('../user/user.factory')

jest.setTimeout(JEST_TIMEOUT)

beforeAll(async () => {
  await setupStrapi()
})

afterAll(async () => {
  await stopStrapi()
})

describe('Receipt', () => {
  let primaryUser

  beforeAll(async () => {
    const [user] = await createUser({ type: 'authenticated' })
    primaryUser = user
  })

  it.each([
    { type: 'public', code: 403 },
    { type: 'authenticated', code: 403 },
    { type: 'manager', code: 403 },
    { type: 'moderator', code: 200 },
  ])(
    'should $type user have a code $code to get all coupons',
    async ({ type, code }) => {
      const [, jwt] = await createUser({ type })

      const req = request(strapi.server.httpServer)
        .get(`/api/receipts`)
        .set('accept', 'application/json')
        .set('Content-Type', 'application/json')

      if (jwt) {
        req.set('Authorization', `Bearer ${jwt}`)
      }

      await req.expect('Content-Type', /json/).expect(code)
    }
  )

  it('should coupon owner be able to verify coupon with receipt', async () => {
    const coupon1 = await createCoupon({
      email: primaryUser.email,
      user: primaryUser.id,
      uuid: 'uuid1',
    })

    const coupon2 = await createCoupon({
      email: 'user1@gmail.com',
      uuid: 'uuid2',
    })

    var formData = new FormData()

    formData.append(
      'files.photo',
      fs.createReadStream('tests/coupon/receipt.jpeg')
    )

    await request(strapi.server.httpServer)
      .post(`/api/receipts`)
      .set('accept', 'application/json')
      .set('Content-type', 'multipart/form-data')
      .field(
        'data',
        JSON.stringify({ text: 'text1', coupons: [coupon1.uuid, coupon2.uuid] })
      )
      .attach(
        'files.photo',
        path.join(__dirname, './receipt.webp'),
        'receipt.webp'
      )
      .expect('Content-Type', /json/)
      .expect(200)
      .then(({ body: { data } }) => {
        expect(data.attributes.text).toBe('text1')
      })
  })
})
