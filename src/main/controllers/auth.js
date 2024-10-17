const electron = require('electron')
const path = require('path')
const fs = require('fs')

class MyAuth {
  constructor(opts) {
    const userDataPath = (electron.app || electron.remote.app).getPath('userData')
    this.dataPath = path.join(userDataPath, opts.configName + '.json')
    this.data = parseDataFile(this.dataPath)
  }

  get(key) {
    return this.data
  }

  set(val) {
    if (!this.data) {
      this.data = []
    }
    this.data.push(val)
    fs.writeFileSync(this.dataPath, JSON.stringify(this.data))
    return true
  }
  delete() {
    this.data = []
    fs.writeFileSync(this.dataPath, JSON.stringify(this.data))
    return true
  }
}

function parseDataFile(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath))
  } catch (error) {
    return []
  }
}

module.exports = MyAuth
