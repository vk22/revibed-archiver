const electron = require('electron')
const path = require('path')
const fs = require('fs')
const ripsStoreFolder = '/Volumes/WD/KX-rips/'

class MyStore {
  constructor(opts) {
    //const userDataPath = (electron.app || electron.remote.app).getPath('userData');
    const userDataPath = ripsStoreFolder
    this.dataPath = path.join(userDataPath, opts.configName + '.json')
    this.data = parseDataFile(this.dataPath)
    //this.filesPath = path.join(userDataPath, 'files/');
    this.filesPath = userDataPath
    this.userDataPath = userDataPath
  }

  get(key) {
    return this.data.find((item) => item.projectID === key)
  }

  getByReleaseID(key) {
    return this.data.find((item) => item.releaseID === key.toString())
  }

  getAll() {
    return this.data
  }

  set(key, val) {
    if (!this.data) {
      this.data = []
    }
    this.data.push(val)
    fs.writeFileSync(this.dataPath, JSON.stringify(this.data))
    return true
  }
  edit(key, val) {
    const objIndex = this.data.findIndex((item) => item.projectID === key)
    this.data[objIndex] = val
    fs.writeFileSync(this.dataPath, JSON.stringify(this.data))
    return true
  }
  delete(key) {
    const index = this.data.findIndex((item) => item.projectID === key)
    this.data.splice(index, 1)
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

module.exports = MyStore
