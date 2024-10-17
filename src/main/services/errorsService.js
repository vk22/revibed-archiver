class ErrorsService {
  constructor() {
    this.errors = []
  }
  add(data) {
    const checkError = this.errors.includes(data)
    if (!checkError) {
      this.errors.push(data)
    }
    return this
  }
  getAll() {
    return this.errors
  }
  clear() {
    this.errors = []
  }
}

module.exports = new ErrorsService()
