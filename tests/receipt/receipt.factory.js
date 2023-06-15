const mockReceiptData = (data = {}) => {
  return {
    photo: null,
    coupons: [],
    text: ' Receipt text',
    ...data,
  }
}

const createReceipt = async (data = {}) => {
  return strapi.db.query('api::receipt.receipt').create({
    data: mockReceiptData(data),
  })
}

module.exports = {
  createReceipt,
}
