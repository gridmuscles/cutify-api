const { ERROR_CODES } = require('../../src/utils/const')

const mockPromotionData = (data = {}) => {
  const slugSuffix = Math.round(Math.random() * 10000).toString()
  return {
    title: 'Pizza Mondays',
    title_pl: 'Poniedziałki Pizzy',
    title_ua: 'Понеділки Піци',
    title_ru: 'Понедельник Пиццы',
    slug: `pizza-mondays${slugSuffix}`,
    subtitle: 'Enjoy 50% off on all pizzas every Monday!',
    subtitle_pl:
      'Ciesz się 50% zniżki na wszystkie pizze w każdy poniedziałek!',
    subtitle_ua: 'Насолоджуйтесь знижкою 50% на всі піци щопонеділка!',
    subtitle_ru: 'Получите скидку 50% на все меню пиццы каждый понедельник!',
    images: [],
    terms:
      'Valid only on Mondays. Not valid with other offers or discounts. Dine-in only.',
    terms_pl:
      'Oferta ważna tylko w poniedziałki. Nie łączy się z innymi ofertami ani zniżkami. Oferta tylko dla klientów, którzy spożywają posiłek na miejscu.',
    terms_ua:
      'Дійсно лише в понеділок. Не поєднується з іншими пропозиціями або знижками. Діє лише при прийомі їжі на місці.',
    terms_ru:
      'Действительно только по понедельникам. Не сочетается с другими предложениями или скидками. Действует только для гостей, которые употребляют пищу на месте.',
    discountTo: 50,
    dateTimeUntil: '2100-04-30 23:59:59',
    publishedAt: '2023-01-01 23:59:59',
    auction: null,
    categories: [],
    organization: null,
    isChatAvailable: false,
    size: 'x',
    order: null,
    ...data,
  }
}

const createPromotion = async (data = {}) => {
  if (!data.categories || !data.organization) {
    strapi.log.warn(ERROR_CODES.NO_REQUIRED_DYNAMIC_DATA)
  }

  const seoComponent = await strapi.query('shared.seo').create({
    data: data.seo ?? {},
  })

  return strapi.db.query('api::promotion.promotion').create({
    data: {
      ...mockPromotionData(data),
      seo: seoComponent.id,
    },
  })
}

module.exports = {
  createPromotion,
}
