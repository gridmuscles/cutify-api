module.exports = {
  afterCreate: async ({ result }) => {
    if (result.pin) {
      return
    }

    const maxPinLocation = await strapi
      .query('api::location.location')
      .findOne({
        where: { id: { $not: result.id } },
        orderBy: { pin: 'desc' },
        offset: 0,
        limit: 1,
      })

    const nextPin = maxPinLocation
      ? (Number(maxPinLocation.pin) + 1).toString().padStart(4, '0')
      : '0001'

    await strapi
      .query('api::location.location')
      .update({ where: { id: result.id }, data: { pin: nextPin } })
  },
}
