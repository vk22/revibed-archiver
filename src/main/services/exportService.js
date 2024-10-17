const fs = require('fs-extra')
const { join, extname, basename } = require('path')
const archiver = require('archiver')
const { rimraf, rimrafSync } = require('rimraf')
const kxFolder = '/Volumes/WD/KX-rips/'
const MyStore = require('./kx-store.js')
const store = new MyStore({
  configName: 'music-db'
})
const FormData = require('form-data')
const fetch = require('node-fetch')
const axios = require('axios')
const child_process = require('child_process')
const initFFmpeg = require('../services/ffmpegService')
const { _ } = require('core-js')
let ffmpegPath
initFFmpeg().then((data) => {
  ffmpegPath = data
})

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const antonFoldersInner = ['hi', 'hi2', 'hi3', 'low', 'low2', 'low3']
// this.kxBalanceFolder = `${revibedStockFolder}/kx-balance/`
// this.revibedFolder = `${revibedStockFolder}/Revibed/`
const conditionData = {
  M: 3,
  NM: 4,
  'VG+': 5,
  VG: 6,
  'G+': 7,
  G: 8,
  F: 9,
  P: 10
}

const conditionToQuality = {
  M: 'HI',
  NM: 'HI',
  'VG+': 'HI',
  VG: 'LOW',
  'G+': 'LOW',
  G: 'LOW',
  F: 'LOW',
  P: 'LOW'
}

// const UserService = require("../services/userService");

// const revibedStockFolder = '/Volumes/WD/MEGA-Marketplace-Final'
// const exportFolder = '/Volumes/WD/RVBD_Upload'

class ExportService {
  constructor() {
    // this.antonFolder = `${revibedStockFolder}/Anton/`
    // this.exportFolder = exportFolder
    // this.exportFolderAnton = `${exportFolder}/Anton/`
    // this.exportFolderRevibed = `${exportFolder}/Revibed/`
  }

  async sendReleasesToYoutube(releases, userFolders) {
    const storageFolder = `${userFolders.storageFolder}`
    for (var i = 0; i < releases.length; i++) {
      let releaseData = releases[i]
      let source = releaseData.source
      let fileForYoutube = await this.getFileForYoutube(releaseData, storageFolder)
      console.log('getReleaseForYoutube fileForYoutube ', fileForYoutube)
      if (fileForYoutube) {
        const createMp3 = await this.convertToMp3(fileForYoutube)
        console.log('getReleaseForYoutube createMp3 ', createMp3)
        if (createMp3) {
          await this.sendFileToUploaderX(createMp3.path, createMp3.filename)
          fs.unlinkSync(createMp3.path)
        }
      }
    }
    return {
      success: true
    }
  }

  async getFileForYoutube(releaseData, storageFolder) {
    return new Promise((resolve, reject) => {
      const releaseID = releaseData.releaseID
      const exportFolder = `${storageFolder}/${releaseID}/RESTORED`
      if (fs.existsSync(exportFolder)) {
        const files = fs.readdirSync(exportFolder).filter((el) => el !== '.DS_Store')
        const path = `${exportFolder}/${files[0]}`
        const filename = `${releaseID}--${files[0]}`
        const fileData = { path, filename, exportFolder }
        resolve(fileData)
      } else {
        resolve(false)
      }
    })
  }

  getConditionFromFolder(folder) {
    if (Array.from(folder)[0].toUpperCase() === 'H') {
      return { condition: 'VG+', quality: 'HI' }
    } else if (Array.from(folder)[0].toUpperCase() === 'L') {
      return { condition: 'VG', quality: 'LOW' }
    }
  }

  getTargetDirAndCondition(mainFolder, innerFolders, folderName) {
    for (const innerFolder of innerFolders) {
      let dir = `${mainFolder}${innerFolder}/${folderName}`
      if (fs.existsSync(dir)) {
        let { condition, quality } = this.getConditionFromFolder(innerFolder)
        return {
          dir: dir,
          condition: condition,
          quality: quality
        }
      }
    }
  }

  sendFileToUploaderX(path, filename) {
    console.log('sendFileToUploaderX ', path)
    const fileBuffer = fs.readFileSync(path)
    console.log('fileBuffer ', fileBuffer)
    const form = new FormData()
    form.append('file', fileBuffer, {
      contentType: 'audio/mp3',
      filename: filename
    })
    return fetch(`https://uploader-x.com/api/upload-file-rvbd`, { method: 'POST', body: form })
  }

  async convertToMp3(file) {
    const { path, filename, exportFolder } = file
    return new Promise(function (resolve, reject) {
      let extension = extname(filename)
      let name = basename(filename, extension)
      let finalFileName = name + '.mp3'
      let finalFilePath = exportFolder + '/' + finalFileName
      /// ffmpeg -i input.flac -ab 320k -map_metadata 0 -id3v2_version 3 output.mp3
      console.log('ffmpegPath ', ffmpegPath)
      console.log('filePath ', path)
      console.log('finalFilePath ', finalFilePath)
      let convert = child_process.spawn(ffmpegPath, [
        '-i',
        path,
        `-ab`,
        `320k`,
        `-map_metadata`,
        `0`,
        `-id3v2_version`,
        `3`,
        finalFilePath
      ])
      convert
        .on('data', (err) => {
          console.log('convertToMp3 data: ', new String(err))
        })
        .on('exit', (statusCode) => {
          console.log('convertToMp3 exit: ' + statusCode)
          if (statusCode === 0) {
            try {
              //fs.unlinkSync(filePath);
            } catch (error) {
              console.log(error)
            }
            resolve({ path: finalFilePath, filename: finalFileName })
          } else {
            reject()
          }
        })
    }).then((result) => {
      return result
    })
  }

  zipDirectory(finalVISUAL, finalRESTORED, outPath) {
    // console.log('finalPathForZip ', finalPathForZip)
    console.log('outPath ', outPath)

    const archive = archiver('zip', { zlib: { level: 9 } })
    const stream = fs.createWriteStream(outPath)

    return new Promise((resolve, reject) => {
      archive
        .directory(finalVISUAL, 'VISUAL')
        .directory(finalRESTORED, 'RESTORED')
        .on('error', (err) => reject(err))
        .pipe(stream)
      archive.finalize()
      stream.on('close', () => resolve())
    })
  }
  async getReleaseForRVBD(releases, userFolders) {
    console.log('getReleaseForRVBD ', releases.length)
    let finalData = []
    let fileID = 101030
    console.log('userFolders ', userFolders)
    const exportFolder = `${userFolders.exportFolder}`
    const storageFolder = `${userFolders.storageFolder}`

    for (var i = 0; i < releases.length; i++) {
      const ripData = releases[i]
      const source = ripData.source
      const releaseID = ripData.releaseID
      const condition = ripData.condition
      fileID = releaseID

      const exportFolderItem = `${exportFolder}`
      const exportFolderItemVisual = `${exportFolderItem}/VISUAL/`
      const exportFolderItemRestored = `${exportFolderItem}/RESTORED/`

      if (!fs.existsSync(exportFolderItem)) {
        fs.mkdirSync(exportFolderItem)
      }
      if (!fs.existsSync(exportFolderItemVisual)) {
        fs.mkdirSync(exportFolderItemVisual)
      }
      if (!fs.existsSync(exportFolderItemRestored)) {
        fs.mkdirSync(exportFolderItemRestored)
      }

      const initFolder = `${storageFolder}/${releaseID}/`

      if (initFolder) {
        let initFolderVisual = initFolder + '/VISUAL'
        let initFolderRestored = initFolder + '/RESTORED'
        try {
          if (fs.existsSync(initFolderVisual)) {
            fs.copySync(initFolderVisual, exportFolderItemVisual)
          }
          if (fs.existsSync(initFolderRestored)) {
            fs.copySync(initFolderRestored, exportFolderItemRestored)
          }
          await this.zipDirectory(
            exportFolderItemVisual,
            exportFolderItemRestored,
            exportFolderItem + '/' + fileID + '.zip'
          )
          await rimraf(exportFolderItemVisual)
          await rimraf(exportFolderItemRestored)
          console.log(fileID + ' DONE')
          // if (i+1 === 10) { break; }
        } catch (error) {
          console.log('error ', error.message)
        }

        let itemData = {
          file_id: fileID.toString(),
          discogs_release_id: releaseID,
          condition_id: conditionData[condition],
          condition: condition,
          from_editor: true
        }
        finalData.push(itemData)
      } else {
        console.log('not found ', releaseID)
      }

      fileID += 1
    }

    console.log('finalData ', finalData.length)
    fs.writeFileSync(exportFolder + '/goods.json', JSON.stringify(finalData), 'utf-8')
    return true
  }
}

module.exports = new ExportService()
