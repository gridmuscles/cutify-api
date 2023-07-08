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

module.exports = {
  createReport,
}
