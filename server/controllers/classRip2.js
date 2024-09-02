const { getReleaseData } = require('./discogsUtils')
;(async () => {
  const discogsReleaseData = await getReleaseData(1400134)
  console.log('discogsReleaseData ', discogsReleaseData)
})()

class Rip {
  constructor(rootFolder) {
    this.releaseData = null
    this.rootFolder = rootFolder
    this.ripFolder = null
  }

  getRelease() {
    return new Promise(async (resolve, reject) => {
      this.releaseData = await getReleaseData(1400134)
      resolve()
    })
  }

  prepareReleaseData() {
    this.releaseData.ready = true
    return this
  }

  createRipFolder() {
    if (this.releaseData.format === 'vinyl') {
      this.ripFolder = '/rip-folder/vinyl/'
    } else {
      this.ripFolder = '/rip-folder/notvinyl/'
    }
    return this
  }

  checkFiles() {
    this.fileList = ['111', '222', '333']
    return this
  }

  setMetadata() {
    this.metadataDone = true
    return this
  }

  createLineageFile() {
    this.lineageFile = `${this.releaseData.name}-lineageFile.txt`
    return this
  }

  toString() {
    return this
  }
}

function discogsParse() {
  return new Promise((resolve, reject) => {
    try {
      const releaseData = {
        id: '7483',
        name: 'The Beat Goes On',
        format: 'vinyl'
      }
      setTimeout(() => {
        resolve(releaseData)
      }, 3000)
    } catch (err) {
      reject(err)
    }
  })
}
// (async () => {
//     const koko = await discogsParse()
//     console.log('koko ', koko)
// })()

const ripA = new Rip('/root/ripA/')
  .getRelease()
  .createRipFolder()
  .checkFiles()
  .setMetadata()
  .createLineageFile()

console.log(ripA)
