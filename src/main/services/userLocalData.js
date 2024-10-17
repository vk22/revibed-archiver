const electron = require('electron')
const path = require('path')
const fs = require('fs')

class UserLocalDataStore {
  constructor(opts) {
    const userDataPath = (electron.app || electron.remote.app).getPath('userData')
    console.log('userDataPath ', userDataPath)
    this.userDataPath = userDataPath
    this.path = path.join(userDataPath, 'userData.json')
    this.data = this.parseDataFile(this.path)

    if (!fs.existsSync(this.userDataPath)) {
      fs.mkdirSync(this.userDataPath)
    }
  }

  get() {
    return this.data
  }

  set(val) {
    console.log('val ', val)
    console.log('this.userDataPath ', this.userDataPath)
    this.data = val
    try {
      if (!fs.existsSync(this.userDataPath)) {
        fs.mkdirSync(this.userDataPath)
      }
      fs.writeFileSync(this.path, JSON.stringify(this.data))
      return true
    } catch (error) {
      console.log(error.message)
      return false
    }
  }

  parseDataFile(filePath) {
    try {
      return JSON.parse(fs.readFileSync(filePath))
    } catch (error) {
      return false
    }
  }
}

// expose the class
module.exports = new UserLocalDataStore()
