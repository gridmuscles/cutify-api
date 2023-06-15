const QRCode = require('qrcode')
const PDFDocument = require('pdfkit')

const { t } = require('../i18n')
const { getCouponListUrl } = require('./dynamic-link')

const addCouponPageToDoc = async ({ doc, host, locale, coupon, terms }) => {
  const title = coupon.promotion?.title ?? coupon.title
  const dateTimeUntil = coupon.promotion?.dateTimeUntil ?? coupon.dateTimeUntil
  const qr = await QRCode.toDataURL(
    getCouponListUrl({
      host,
      locale,
      promotionId: coupon.promotion.id,
      uuidList: [coupon.uuid],
    })
  )

  doc
    .rect(doc.x - 10, doc.y - 10, doc.page.width - 30, doc.page.height - 50)
    .stroke()

  doc
    .fontSize(16)
    .text(`${t[locale]['coupon']['forService']}: ${title}`, {
      align: 'left',
    })
    .moveDown()

  const imagePosition = doc.y
  doc.image(qr, { fit: [125, 125] })
  const afterImagePosition = doc.y

  doc
    .fontSize(12)
    .text(`# ${coupon.uuid}`, doc.x, imagePosition, {
      align: 'right',
    })
    .fontSize(10)
    .text(`${t[locale]['coupon']['validTill']} ${dateTimeUntil}`, {
      align: 'right',
    })
    .moveDown()

  doc.y = afterImagePosition

  doc.fontSize(8).text(terms.text, doc.x, afterImagePosition, { align: 'left' })
  doc
    .fontSize(9)
    .text('Cappybara.com', doc.page.width - 100, doc.page.height - 25, {
      lineBreak: false,
    })
}

const getCouponListPdf = async ({ coupons, terms, host, locale }) => {
  const doc = new PDFDocument({ size: 'A5', margin: 25 })
  doc.font('src/api/coupon/assets/NotoSans-Medium.ttf')

  const [firstCoupon, ...otherCoupons] = coupons
  await addCouponPageToDoc({ doc, host, locale, coupon: firstCoupon, terms })

  for (let coupon of otherCoupons) {
    doc.addPage()
    await addCouponPageToDoc({ doc, host, locale, coupon, terms })
  }

  doc.end()
  return doc
}

module.exports = {
  getCouponListPdf,
}
