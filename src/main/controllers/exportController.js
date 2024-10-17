const fs = require('fs-extra')
const { readdirSync, renameSync } = require('fs')
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
// const log = require('electron-log')
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
          //log.warn('reject ' + err)
        }
      }
    )
  })
}
initFFbinaries()
const child_process = require('child_process')

let conditionData = {
  M: 3,
  NM: 4,
  'VG+': 5,
  VG: 6,
  'G+': 7,
  G: 8,
  F: 9,
  P: 10
}
const getConditionFromFolder = (folder) => {
  if (Array.from(folder)[0].toUpperCase() === 'H') {
    return 'VG+'
  } else if (Array.from(folder)[0].toUpperCase() === 'L') {
    return 'VG'
  }
}

const getTargetDirAndCondition = (mainFolder, innerFolders, folderName) => {
  for (const item of innerFolders) {
    let dir = `${mainFolder}${item}/${folderName}`
    if (fs.existsSync(dir)) {
      let condition = getConditionFromFolder(item)
      return {
        dir: dir,
        condition: condition
      }
    }
  }
}

const getReleases = async () => {
  try {
    return await axios.get('http://labels.kx-streams.com/api/get-releases', {
      headers: {
        'x-api-key': 'l74b9ba9qmext9a6ulniigq8'
      }
    })
  } catch (error) {
    console.error(error)
  }
}

const getRevibedReleasesList = () => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'labels.kx-streams.com',
      port: 80,
      path: '/api/get-releases',
      method: 'GET',
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
  })
}

const updateRelaesesForRVBD = async (req, res, next) => {
  const data = await getReleases()
  const releases = data.data.releases
  console.log('releases ', releases.length)
  let filter = releases.filter(
    (item) => list.indexOf(item.releaseID) > -1 && item.source === 'KX Balance'
  )
  console.log('filter ', filter)
  await getReleaseFunc(filter)
}

const getReleaseForRVBD = async (req, res, next) => {
  await getReleaseFunc(req.body.releases)
  res.json({
    success: true
  })
}

const getReleaseFunc = async (releases) => {
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
          await zipDirectory(finalVISUALKX, finalRESTOREDKX, finalFolderKX + '/' + fileID + '.zip')
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
      let targetDir = getTargetDirAndCondition(antonFolder, antonFoldersInner, folderName)
      let initPath = targetDir.dir
      let condition = targetDir.condition
      console.log('initPath ', initPath)
      if (initPath) {
        let visualFolder = initPath + '/VISUAL'
        let restoredFolder = initPath + '/RESTORED'
        try {
          fs.copySync(visualFolder, finalVISUALAnton)
          if (fs.existsSync(restoredFolder)) {
            fs.copySync(restoredFolder, finalRESTOREDAnton)
          } else {
            fs.copySync(audioFolder, finalRESTOREDAnton)
          }
          await zipDirectory(
            finalVISUALAnton,
            finalRESTOREDAnton,
            finalFolderAnton + '/' + fileID + '.zip'
          )
          await rimraf(finalVISUALAnton)
          await rimraf(finalRESTOREDAnton)
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
    } else if (source === 'KX Balance') {
      let folderName = releaseID
      let folderHigh = kxBalanceFolder + '/High/' + folderName
      let folderLow = kxBalanceFolder + '/Low/' + folderName
      let initPath
      let condition
      if (fs.existsSync(folderHigh)) {
        initPath = folderHigh
        condition = 'NM'
      } else if (fs.existsSync(folderLow)) {
        initPath = folderLow
        condition = 'VG'
      }
      if (initPath) {
        let visualFolder = initPath + '/VISUAL'
        let restoredFolder = initPath + '/RESTORED'

        try {
          fs.copySync(visualFolder, finalVISUALBalance)
          if (fs.existsSync(restoredFolder)) {
            fs.copySync(restoredFolder, finalRESTOREDBalance)
          } else {
            fs.copySync(audioFolder, finalRESTOREDBalance)
          }
          await zipDirectory(
            finalVISUALBalance,
            finalRESTOREDBalance,
            finalFolderBalance + '/' + fileID + '.zip'
          )
          await rimraf(finalVISUALBalance)
          await rimraf(finalRESTOREDBalance)
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
    }

    fileID += 1
  }

  console.log('finalData ', finalData.length)
  fs.writeFileSync(finalFolder + 'goods.json', JSON.stringify(finalData), 'utf-8')
  return true
}

function zipDirectory(finalVISUAL, finalRESTORED, outPath) {
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

    // finalPathForZip.forEach((item, i) => {
    //   if (item.type === 'file') {
    //     archive.file(item.path, { name: item.name })
    //   } else {
    //     archive.directory(item.path, item.name);
    //   }

    //  })

    archive.finalize()
    stream.on('close', () => resolve())
  })
}

const getReleaseForYoutube = async (req, res, next) => {
  let releases = req.body.releases
  for (var i = 0; i < releases.length; i++) {
    let releaseData = releases[i]
    let source = releaseData.source
    let fileData
    if (source === 'KX') {
      fileData = await collectFilesForYoutubeKX(releaseData)
    } else if (source === 'Anton') {
      fileData = await collectFilesForYoutubeAnton(releaseData)
    } else if (source === 'Revibed') {
      fileData = await collectFilesForYoutubeRevibed(releaseData)
    } else if (source === 'KX Balance') {
      fileData = await collectFilesForYoutubeKXBalance(releaseData)
    }
    console.log('getReleaseForYoutube fileData ', fileData)
    const createMp3 = await convertToMp3(fileData.path, fileData.filename, fileData.targetFolder)
    console.log('getReleaseForYoutube createMp3 ', createMp3)
    await sendFileToUploaderX(createMp3.path, createMp3.filename)
    fs.unlinkSync(createMp3.path)
  }
  res.json({
    success: true
  })
}

async function collectFilesForYoutubeAnton(releaseData) {
  return new Promise((resolve, reject) => {
    let folderName = releaseData.releaseID
    let path, filename
    console.log('getTargetDirAndCondition ', antonFolder, antonFoldersInner, folderName)
    const targetFolder = getTargetDirAndCondition(antonFolder, antonFoldersInner, folderName)
    const targetFolderRestored = `${targetFolder.dir}/RESTORED`
    console.log('targetFolderRestored ', targetFolderRestored)
    if (targetFolderRestored) {
      const files = fs.readdirSync(targetFolderRestored).filter((el) => el !== '.DS_Store')
      path = `${targetFolderRestored}/${files[0]}`
      filename = `${folderName}--${files[0]}`
    }
    resolve({ path, filename, targetFolder: targetFolderRestored })
  })
}

async function collectFilesForYoutubeKX(releaseData) {
  return new Promise((resolve, reject) => {
    let path, filename
    const kxBD = JSON.parse(fs.readFileSync(kxBDFile, 'utf-8'))
    let releaseID = releaseData.releaseID
    let project = kxBD.find((item) => {
      return releaseID == +item.releaseID
    })
    console.log('project ', project)
    let folderName = project.projectID
    const restoredFolder = kxFolder + folderName + '/RESTORED'
    const audioFolder = kxFolder + folderName + '/AUDIO'
    let targetFolder
    if (fs.existsSync(restoredFolder)) {
      targetFolder = restoredFolder
    } else if (fs.existsSync(audioFolder)) {
      targetFolder = audioFolder
    }
    if (targetFolder) {
      const files = fs.readdirSync(targetFolder).filter((el) => el !== '.DS_Store')
      path = `${targetFolder}/${files[0]}`
      filename = `${releaseID}--${files[0]}`
    }
    resolve({ path, filename, targetFolder })
  })
}

async function collectFilesForYoutubeKXBalance(releaseData) {
  return new Promise((resolve, reject) => {
    let path, filename
    let folderName = releaseData.releaseID
    const restoredFolder = kxBalanceFolder + '/High/' + folderName + '/RESTORED'
    const restoredFolder2 = kxBalanceFolder + '/Low/' + folderName + '/RESTORED'
    let targetFolder
    if (fs.existsSync(restoredFolder)) {
      targetFolder = restoredFolder
    } else if (fs.existsSync(restoredFolder2)) {
      targetFolder = restoredFolder2
    }
    if (targetFolder) {
      const files = fs.readdirSync(targetFolder).filter((el) => el !== '.DS_Store')
      path = `${targetFolder}/${files[0]}`
      filename = `${folderName}--${files[0]}`
    }
    resolve({ path, filename, targetFolder })
  })
}

async function collectFilesForYoutubeRevibed(releaseData) {
  return new Promise((resolve, reject) => {
    let folderName = releaseData.releaseID
    let path, filename
    const restoredFolder = revibedFolder + folderName + '/RESTORED'
    let targetFolder
    if (fs.existsSync(restoredFolder)) {
      targetFolder = restoredFolder
    }
    if (targetFolder) {
      const files = fs.readdirSync(targetFolder).filter((el) => el !== '.DS_Store')
      path = `${targetFolder}/${files[0]}`
      filename = `${folderName}--${files[0]}`
    }
    resolve({ path, filename, targetFolder })
  })
}

function sendFileToUploaderX(path, filename) {
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

async function convertToMp3(filePath, filaname, dir) {
  return new Promise(function (resolve, reject) {
    let extension = extname(filaname)
    let name = basename(filaname, extension)
    let finalFileName = name + '.mp3'
    let finalFilePath = dir + '/' + finalFileName
    /// ffmpeg -i input.flac -ab 320k -map_metadata 0 -id3v2_version 3 output.mp3
    console.log('ffmpegPath ', ffmpegPath)
    console.log('filePath ', filePath)
    console.log('finalFilePath ', finalFilePath)
    let convert = child_process.spawn(ffmpegPath, [
      '-i',
      filePath,
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

module.exports = {
  getReleaseForRVBD,
  getReleaseForYoutube,
  updateRelaesesForRVBD
}
