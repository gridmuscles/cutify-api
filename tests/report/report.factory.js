const mockReportData = (data = {}) => {
  return {
    data: null,
    ...data,
  }
}

const createReport = async (data = {}) => {
  return strapi.db.query('api::report.report').create({
    data: mockReportData(data),
  })
}

const getReportById = async (id) => {
  return strapi.db.query('api::report.report').findOne({
    where: { id },
    populate: true,
  })
}

module.exports = {
  createReport,
  getReportById,
}
