const fs = require('fs-extra')
const { join, extname, basename } = require('path')
const path = require('path')
const archiver = require('archiver')
const http = require('http')
const axios = require('axios')
const { rimraf, rimrafSync } = require('rimraf')
const kxFolder = '/Volumes/WD/KX-rips/'
const kxBDFile = '/Volumes/WD/KX-rips/music-db.json'
const antonFolder = '/Volumes/WD/MEGA-Marketplace-Final/Anton/'
const antonFoldersInner = ['hi', 'hi2', 'hi3', 'low', 'low2', 'low3']
const kxBalanceFolder = '/Volumes/WD/MEGA-Marketplace-Final/kx-balance/'
const revibedFolder = '/Volumes/WD/MEGA-Marketplace-Final/Revibed/'
const ytbFolder = '/Volumes/WD/revibed-utils/ytb-files/'
const finalFolder = '/Volumes/WD/revibed-utils/goods/'
const finalFolderAnton = '/Volumes/WD/revibed-utils/goods/inwork/anton/'
const finalVISUALAnton = finalFolderAnton + 'VISUAL'
const finalRESTOREDAnton = finalFolderAnton + 'RESTORED'
const finalFolderKX = '/Volumes/WD/revibed-utils/goods/inwork/kx/'
const finalVISUALKX = finalFolderKX + 'VISUAL'
const finalRESTOREDKX = finalFolderKX + 'RESTORED'
const finalFolderBalance = '/Volumes/WD/revibed-utils/goods/inwork/balance/'
const finalVISUALBalance = finalFolderBalance + 'VISUAL'
const finalRESTOREDBalance = finalFolderBalance + 'RESTORED'
const MyStore = require('./kx-store.js')
const store = new MyStore({
  configName: 'music-db'
})
const FormData = require('form-data')
const fetch = require('node-fetch')
const log = require('electron-log')
const electron = require('electron')
const ffbinaries = require('ffbinaries')
const platform = ffbinaries.detectPlatform()
const ffmpegBinFolder = (electron.app || electron.remote.app).getPath('userData')
console.log('ffmpegBinFolder ', ffmpegBinFolder)
let ffmpegPath, ffprobePath

function initFFbinaries() {
  return new Promise((resolve, reject) => {
    ffbinaries.downloadFiles(
      ['ffmpeg', 'ffprobe'],
      { platform: platform, quiet: true, destination: ffmpegBinFolder },
      (err, data) => {
        if (err) {
          return reject(err)
        }
        try {
          ffmpegPath = path.join(ffmpegBinFolder, ffbinaries.getBinaryFilename('ffmpeg', platform))
          ffprobePath = path.join(
            ffmpegBinFolder,
            ffbinaries.getBinaryFilename('ffprobe', platform)
          )
          resolve()
        } catch (err) {
          reject(err)
          log.warn('reject ' + err)
        }
      }
    )
  })
}
initFFbinaries()
const child_process = require('child_process')

const revibedStockFolder = '/Volumes/WD/MEGA-Marketplace-Final'
const revibedForUploadFolder = '/Volumes/WD/RVBD_Upload'

class ExportService {

  constructor(revibedStockFolder, revibedForUploadFolder) {
    this.antonFolder = `${revibedStockFolder}/Anton/`
    this.antonFoldersInner = ['hi', 'hi2', 'hi3', 'low', 'low2', 'low3']
    this.kxBalanceFolder = `${revibedStockFolder}/kx-balance/`
    this.revibedFolder = `${revibedStockFolder}/Revibed/`
    this.conditionData = {
      'M': 3,
      'NM': 4,
      'VG+': 5,
      'VG': 6,
      'G+': 7,
      'G': 8,
      'F': 9,
      'P': 10
    }
    this.revibedForUploadFolder = revibedForUploadFolder
    this.revibedForUploadFolderAnton = `${revibedForUploadFolder}/Anton/`
    this.revibedForUploadFolderRevibed = `${revibedForUploadFolder}/Revibed/`
  }

  async sendReleasesToYoutube(releases) {
    for (var i = 0; i < releases.length; i++) {
      let releaseData = releases[i]
      let source = releaseData.source
      let fileForYoutube = await this.getFileForYoutube(releaseData, source)
      // if (source === 'KX') {
      //   fileData = await this.collectFilesForYoutubeKX(releaseData)
      // } else if (source === 'Anton') {
      //   fileData = await this.collectFilesForYoutubeAnton(releaseData)
      // } else if (source === 'Revibed') {
      //   fileData = await this.collectFilesForYoutubeRevibed(releaseData)
      // } else if (source === 'KX Balance') {
      //   fileData = await this.collectFilesForYoutubeKXBalance(releaseData)
      // }
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

  async getFileForYoutube(releaseData, source) {
    return new Promise((resolve, reject) => {
      const folderName = releaseData.releaseID
      let targetFolder
      if (source === 'Anton') {
        const targetFolderAnton = this.getTargetDirAndCondition(this.antonFolder, this.antonFoldersInner, folderName);
        targetFolder = `${targetFolderAnton.dir}/RESTORED`
      } else if (source === 'Revibed') {
        targetFolder = this.revibedFolder + folderName + '/RESTORED'
      }
      if (targetFolder) {
        const files = fs.readdirSync(targetFolder).filter((el) => el !== '.DS_Store')
        const path = `${targetFolder}/${files[0]}`
        const filename = `${folderName}--${files[0]}`
        const fileData = { path, filename, targetFolder }
        resolve(fileData)
      } else {
        resolve(false)
      }
    })
  }

  getConditionFromFolder(folder) {
    if (Array.from(folder)[0].toUpperCase() === 'H') {
      return 'VG+'
    } else if (Array.from(folder)[0].toUpperCase() === 'L') {
      return 'VG'
    }
  }

  getTargetDirAndCondition(mainFolder, innerFolders, folderName) {
    for (const innerFolder of innerFolders) {
      let dir = `${mainFolder}${innerFolder}/${folderName}`
      if (fs.existsSync(dir)) {
        let condition = this.getConditionFromFolder(innerFolder)
        return {
          dir: dir,
          condition: condition
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
    const { path, filename, targetFolder } = file
    return new Promise(function (resolve, reject) {
      let extension = extname(filename)
      let name = basename(filename, extension)
      let finalFileName = name + '.mp3'
      let finalFilePath = targetFolder + '/' + finalFileName
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
  async getReleaseForRVBD(releases) {
    console.log('getReleaseForRVBD ', releases.length)
    let finalData = []
    let fileID = 101030

    for (var i = 0; i < releases.length; i++) {
      let ripData = releases[i]
      let source = ripData.source
      let releaseID = ripData.releaseID
      fileID = releaseID
      console.log('release ID ', releaseID)
      console.log('source ', source)

      if (source === 'KX') {
        let kxRip = store.getByReleaseID(releaseID)
        console.log('kxRip ', kxRip)
        if (kxRip) {
          let folderName = kxRip.projectID
          let initPath = kxFolder + '/' + folderName

          let visualFolder = initPath + '/VISUAL'
          let restoredFolder = initPath + '/RESTORED'
          let audioFolder = initPath + '/AUDIO'

          try {
            fs.copySync(visualFolder, finalVISUALKX)
            if (fs.existsSync(restoredFolder)) {
              fs.copySync(restoredFolder, finalRESTOREDKX)
            } else {
              fs.copySync(audioFolder, finalRESTOREDKX)
            }
            await this.zipDirectory(finalVISUALKX, finalRESTOREDKX, finalFolderKX + '/' + fileID + '.zip')
            await rimraf(finalVISUALKX)
            await rimraf(finalRESTOREDKX)
            console.log(fileID + ' DONE')
          } catch (error) {
            console.log('error ', error.message)
          }

          let condition = kxRip.media ? kxRip.media : kxRip.conditionMedia
          if (!condition) {
            condition = 'VG+'
          }
          let conditionFinal
          if (condition.indexOf('(') > -1) {
            conditionFinal = condition.slice(condition.indexOf('(') + 1, condition.indexOf(')'))
          } else {
            conditionFinal = condition
          }
          let itemData = {
            file_id: fileID.toString(),
            discogs_release_id: kxRip.releaseID,
            condition_id: conditionData[conditionFinal],
            condition: conditionFinal,
            from_editor: false
          }
          finalData.push(itemData)
        } else {
          console.log('not found ', releaseID)
        }
      } else if (source === 'Anton') {
        let folderName = releaseID
        let targetDir = this.getTargetDirAndCondition(this.antonFolder, this.antonFoldersInner, folderName)
        let initFolder = targetDir.dir
        let condition = targetDir.condition
        console.log('initPath ', initFolder)

        const targetFolder = this.revibedForUploadFolderAnton;
        const targetFolderVisual = `${this.revibedForUploadFolderAnton}/VISUAL/`
        const targetFolderRestored = `${this.revibedForUploadFolderAnton}/RESTORED/`

        if (!fs.existsSync(targetFolder)) {
          fs.mkdirSync(targetFolder)
        }
        if (!fs.existsSync(targetFolderVisual)) {
          fs.mkdirSync(targetFolderVisual)
        }
        if (!fs.existsSync(targetFolderRestored)) {
          fs.mkdirSync(targetFolderRestored)
        }

        if (initFolder) {
          let initFolderVisual = initFolder + '/VISUAL'
          let initFolderRestored = initFolder + '/RESTORED'
          try {
            if (fs.existsSync(initFolderVisual)) {
              fs.copySync(initFolderVisual, targetFolderVisual)
            }
            if (fs.existsSync(initFolderRestored)) {
              fs.copySync(initFolderRestored, targetFolderRestored)
            }
            await this.zipDirectory(
              targetFolderVisual,
              targetFolderRestored,
              targetFolder + '/' + fileID + '.zip'
            )
            await rimraf(targetFolderVisual)
            await rimraf(targetFolderRestored)
            console.log(fileID + ' DONE')
            // if (i+1 === 10) { break; }
          } catch (error) {
            console.log('error ', error.message)
          }

          let itemData = {
            file_id: fileID.toString(),
            discogs_release_id: releaseID,
            condition_id: this.conditionData[condition],
            condition: condition,
            from_editor: true
          }
          finalData.push(itemData)
        } else {
          console.log('not found ', releaseID)
        }
      }

      fileID += 1
    }

    console.log('finalData ', finalData.length)
    fs.writeFileSync(this.revibedForUploadFolder + '/goods.json', JSON.stringify(finalData), 'utf-8')
    return true
  }

}

module.exports = new ExportService(revibedStockFolder, revibedForUploadFolder);