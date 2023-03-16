module.exports = {
  afterCreate(event) {
    const { result, params } = event
    console.log(result)
  },

  afterDelete(event) {
    const { result, params } = event
    console.log(result)
  },
}
