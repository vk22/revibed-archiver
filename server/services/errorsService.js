class ErrorsService {
  errors = []
  add(data) {
    const checkError = this.errors.includes(data)
    if (!checkError) {
      this.errors.push(data)
    }
    return this
  }
}

module.exports = new ErrorsService();