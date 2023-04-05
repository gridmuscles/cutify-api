const mockReservationData = (data = {}) => {
  return {
    dateTimeFrom: '2023-04-10 14:00:00',
    dateTimeTo: '2023-04-10 15:00:00',
    comment:
      'I would like to request a non-smoking room with a king-size bed and a view of the city. Also, I have a special request for a late check-in at around 10 PM on the day of arrival. Thank you!',
    ...data,
  }
}

const createReservation = async (data = {}) => {
  if (!data.organization || !data.user || !data.service || !data.target) {
    throw new Error(ERROR_CODES.NO_REQUIRED_DYNAMIC_DATA)
  }

  return strapi.db.query('api::reservation.reservation').create({
    data: {
      organization: data.organization,
      user: data.user,
      service: data.service,
      target: data.target,
      ...mockReservationData(data),
    },
  })
}

const clearReservations = () => {
  return strapi.db.query('api::reservation.reservation').deleteMany()
}

module.exports = {
  mockReservationData,
  createReservation,
  clearReservations,
}
