const fs = require('fs-extra')
const { join, extname, basename } = require('path')
const { getReleaseData, downloadImages } = require('./discogsUtils')
const { prepareReleaseData, createLineageFile, renameFolder } = require('./utils')
const {
  allowedAudioFormats,
  createFolders,
  getFilesSpectros,
  zipDirectory
} = require('./filesUtils')
const { setMetadataRESTORED, convertToFlac, changeFlac } = require('./id3Utils')
const { createCoverPic } = require('./imageUtils')
const rawFileRate = '24/96000'
const restoredFileRate = '16/44100'
const MyStore = require('./store.js')
const store = new MyStore({
  configReleases: 'anton-releases-db',
  configLabels: 'anton-label-db'
})
const http = require('http')

class Project {
  constructor() {
    this.rootFolder = null
    this.releaseID = undefined
    this.releaseData = null
    this.discogsTracklist = null
    this.needCheckFiles = null
    this.needFLAC = null
    this.allFilesList = []
    this.restoredFilesList = []
    this.filesRESTORED = []
    this.mainImage = null
    this.errors = []
    this.source = undefined
  }
  setInitialData(rootFolder, rip) {
    this.rootFolder = rootFolder
    this.folderRESTORED = this.rootFolder
    const filesInFolder = fs.readdirSync(this.folderRESTORED)
    this.filesRESTORED = filesInFolder.filter((file) => {
      const fileExt = extname(file)
      if (allowedAudioFormats.indexOf(fileExt) > -1) {
        return file
      }
    })
  }
  clearData() {
    this.rootFolder = null
    this.releaseID = undefined
    this.releaseData = null
    this.discogsTracklist = null
    this.needCheckFiles = null
    this.needFLAC = null
    this.allFilesList = []
    this.restoredFilesList = []
    this.filesRESTORED = []
    this.mainImage = null
    this.discogsImages = []
    this.errors = []
    this.source = undefined
  }
  async getSpectros() {
    const restoredData = {
      folder: this.folderRESTORED,
      audioFiles: this.filesRESTORED,
      rate: restoredFileRate,
      isRaw: false
    }
    //restoredData, discogsTracklist, rootFolder
    //const result = await checkFiles(restoredData, this.discogsTracklist, this.rootFolder);
    this.folderSPECTRO = this.rootFolder + '/SPECTRO/'
    const result = await getFilesSpectros(restoredData, this.folderSPECTRO)
    this.restoredFilesList = result.restoredFilesList
    return this
  }
  async getRelease(releaseID, discogsMergeSubtracks) {
    this.releaseID = releaseID
    const discogsReleaseData = await getReleaseData(releaseID, discogsMergeSubtracks)
    // console.log('discogsReleaseData ', discogsReleaseData)
    if (discogsReleaseData) {
      this.discogsTracklist = discogsReleaseData.tracklist
      this.releaseData = await prepareReleaseData(discogsReleaseData)
    }
    console.log('getRelease ', this.project)
    return this
  }
  async downloadDiscogsImages() {
    console.log('downloadDiscogsImages ', this)
    if (this.releaseData.images.length) {
      const discogsImages = await downloadImages(this.releaseData.images, this.rootFolder)
      this.discogsImages = discogsImages
    }
    return this
  }
  setMainImage(mainImage) {
    this.mainImage = mainImage
  }
  async setMetadata(matchType) {
    //const mainImage = (this.mainImage) ? this.mainImage : this.releaseData.images[0].uri
    console.log('setMetadata')
    const coverFilePath = `${this.folderRESTORED}/picforfiles.jpg`
    const pathToPic = await createCoverPic(this.mainImage, coverFilePath)
    console.log('pathToPic ', pathToPic)
    const startMetaData = await setMetadataRESTORED(
      this.filesRESTORED,
      this.releaseData,
      this.folderRESTORED,
      pathToPic,
      this.needFLAC,
      matchType
    )
    console.log('startMetaData ', startMetaData)
    if (startMetaData.errors.length) {
      startMetaData.errors.forEach((item) => {
        this.errors.push(item)
      })
    }

    fs.unlinkSync(pathToPic)
    return this
  }
  async archiveProject(source) {
    // this.rip = rip
    // this.needFLAC = rip.needFLAC
    // this.needCheckFiles = rip.needSpectro
    this.source = source
    if (!fs.existsSync(this.rootFolder)) {
      fs.mkdirSync(this.rootFolder)
    }
    let { folderMAIN, allFilesList } = await createFolders(this.rootFolder, this.releaseID)
    //this.allFilesList = allFilesList;
    this.folderMAIN = folderMAIN
    this.folderRESTORED = `${folderMAIN}/RESTORED/`
    this.folderVISUAL = `${folderMAIN}/VISUAL/`
    this.filesRESTORED = fs.readdirSync(this.folderRESTORED)
    this.filesVISUAL = fs.readdirSync(this.folderVISUAL)

    for (const file of this.filesRESTORED) {
      const filePath = this.folderRESTORED + '/' + file
      const fileExt = extname(file)
      if (fileExt !== '.flac') {
        await convertToFlac(filePath, file, this.folderRESTORED)
      } else {
        await changeFlac(filePath, file, this.folderRESTORED)
      }
    }

    const folderName = this.releaseID
    //await zipDirectory(this.folderVISUAL, this.folderRESTORED, this.rootFolder + '/' + folderName + '.zip')
    //await fs.rmSync(this.folderVISUAL, { recursive: true, force: true });
    //await fs.rmSync(this.folderRESTORED, { recursive: true, force: true });
    // await rimraf(this.folderVISUAL);
    // await rimraf(this.folderRESTORED);
    if (this.folderSPECTRO) {
      await fs.rmSync(this.folderSPECTRO, { recursive: true, force: true })
    }

    ///// Save To Databases
    this.addProjectToStore()
    return this
  }
  async addProjectToStore() {
    try {
      const project = {
        title: this.releaseData.title,
        artist: this.releaseData.artist,
        releaseID: +this.releaseID,
        labelID: this.releaseData.labelID,
        labelName: this.releaseData.label
      }
      // project.updated = {}
      // project.updated.$date = Date.now()
      // const getCandidate = store.get(project.releaseID);
      // console.log('getCandidate ', getCandidate)
      // if (!getCandidate) {
      //     const saveProject = store.set(project.releaseID, project);
      //     console.log('saveProject ', saveProject)
      //     if (!saveProject) {
      //         console.log('save Rip error')
      //     }

      // }
      //// Send Release To Revibed DB
      project.source = this.source
      project.updated = Date.now()
      this.saveReleaseToRevibed(project)
    } catch (err) {
      console.log('addProjectToStore err ', err)
    }
  }
  async saveReleaseToRevibed(data) {
    return new Promise((resolve, reject) => {
      try {
        var postData = JSON.stringify(data)
        // const options = {
        //     hostname: 'localhost',
        //     port: 3000,
        //     path: '/add-release',
        //     method: 'POST',
        //     headers: {
        //         'content-type': 'application/json',
        //         'accept': 'application/json',
        //         'x-api-key': 'l74b9ba9qmext9a6ulniigq8'
        //     }
        // };

        const options = {
          hostname: 'labels.kx-streams.com',
          port: 80,
          path: '/api/add-release',
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            accept: 'application/json',
            'x-api-key': 'l74b9ba9qmext9a6ulniigq8'
          }
        }
        const requestPost = http.request(options, (res) => {
          res.setEncoding('utf8')
          res.on('data', (chunk) => {
            console.log(`BODY: ${chunk}`)
          })
          res.on('end', () => {
            console.log('No more data in response.')
          })
        })

        requestPost.on('error', (e) => {
          console.error(`problem with request: ${e.message}`)
        })

        // write data to request body
        requestPost.write(postData)
        requestPost.end()
        resolve(true)
      } catch (err) {
        console.log('saveReleaseToRevibed err ', err)
      }
    })
  }
  async createCover() {
    await createCoverImage(this.ripFolder)
    return this
  }
  async createLineageTxt() {
    await createLineageFile(this.releaseData, this.ripFolder)
    return this
  }
  async renameFolderFinal() {
    this.folderTemp = await renameFolder(this)
    return this
  }
  addErrors(data) {
    const checkError = this.errors.includes(data)
    if (!checkError) {
      this.errors.push(data)
    }
    return this
  }
  toString() {
    return this
  }
}

module.exports = Project
