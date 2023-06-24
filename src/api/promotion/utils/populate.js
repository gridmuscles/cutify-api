const getPromotionListPopulate = ({ locale }) => ({
  populate: {
    auction: true,
    organization: {
      populate: {
        fields: ['id', `title_${locale}`],
      },
    },
    images: true,
  },
})

const getPromotionItemPopulate = ({ locale }) => ({
  populate: {
    auction: true,
    category: {
      fields: ['id', `title_${locale}`],
    },
    organization: {
      populate: {
        fields: ['id', `title_${locale}`],
        locations: true,
      },
    },
    images: true,
    seo: true,
  },
})

module.exports = {
  getPromotionListPopulate,
  getPromotionItemPopulate,
}
