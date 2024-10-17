class Error {
  constructor() {
    this.errors = []
  }

  get() {
    return this.errors
  }

  set(data) {
    this.errors.push(data)
    return true
  }
}

module.exports = Error
