const fs = require('fs')
const { readdirSync, renameSync } = require('fs')
const { join, extname, basename } = require('path')
const child_process = require('child_process')
const path = require('path')
const archiver = require('archiver')
const { removeRawFromName, base64_encode } = require('./utils')
const log = require('electron-log')
const electron = require('electron')
const ffbinaries = require('ffbinaries')
const platform = ffbinaries.detectPlatform()
const ffmpegBinFolder = (electron.app || electron.remote.app).getPath('userData')
let ffmpegPath, ffprobePath
const allowedAudioFormats = ['.aiff', '.aif', '.flac', '.wav']
const allowedVisualFormats = ['.jpg', '.jpeg', '.JPG', '.JPEG', '.png', '.PNG', '.webp']
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

// console.log('process.env ', process.env.FLUENTFFMPEG_COV)

async function getFilesSpectros(restoredData, folderSPECTRO) {
  let restoredFilesList = restoredData.audioFiles.map((el) => {
    return { file: el }
  })
  const listOfPromises = restoredData.audioFiles.map((audioFile) => {
    return createSpectro(restoredData.folder + '/' + audioFile, audioFile, folderSPECTRO)
  })

  let spectros = await Promise.all(listOfPromises)
  spectros.forEach((name, index) => {
    restoredFilesList[index].filename = name
    restoredFilesList[index].spectro = folderSPECTRO + name + '-spectro.png'
  })

  console.log('getFilesSpectros FINAl')

  return { restoredFilesList }
}

async function checkFiles(restoredData, discogsTracklist, rootFolder) {
  //const { folder, audioFiles, rate, isRaw } = rawData
  console.log('checkFiles restoredData', restoredData)
  console.log('checkFiles discogsTracklist', discogsTracklist)
  console.log('checkFiles rootFolder', rootFolder)
  let rawFilesList, restoredFilesList
  return new Promise(function (resolve, reject) {
    restoredFilesList = restoredData.audioFiles.map((el) => {
      return { file: el }
    })

    async function startRESTORED() {
      console.log('startRESTORED START')
      // const listOfPromises1 = restoredData.audioFiles.map(audioFile => {
      //   return parseMetadata(restoredData.folder + "/" + audioFile, restoredData.rate)
      // });
      const listOfPromises2 = restoredData.audioFiles.map((audioFile) => {
        return createSpectro(restoredData.folder + '/' + audioFile, audioFile, rootFolder)
      })
      // const listOfPromises3 = restoredData.audioFiles.map(audioFile => {
      //   return checkFileInTracklist(audioFile, restoredData.isRaw, discogsTracklist)
      // });

      // let fileDatas = await Promise.all(listOfPromises1);
      // console.log('fileDatas ', fileDatas)
      // fileDatas.forEach((fileData, index) => {
      //   restoredFilesList[index].rateIsOk = fileData.success
      //   restoredFilesList[index].rateData = fileData.data
      //   restoredFilesList[index].message = fileData.message
      // })

      let spectros = await Promise.all(listOfPromises2)
      spectros.forEach((name, index) => {
        restoredFilesList[index].filename = name
        restoredFilesList[index].spectro = rootFolder + '/' + name + '-spectro.png'
      })

      console.log('startRESTORED FINAl')
      // let filesInTracklist = await Promise.all(listOfPromises3);
      // filesInTracklist.forEach((fileInTracklist, index) => {
      //   restoredFilesList[index].fileInTracklist = fileInTracklist
      // })

      resolve({ restoredFilesList })
    }
    startRESTORED()
  }).then((result) => {
    console.log('checkFiles result ', result)
    return result
  })
}

async function parseMetadata(filePath, rate) {
  return new Promise(function (resolve, reject) {
    console.log('parseMetadata ', filePath)

    const ffprobe = child_process.spawn(ffprobePath, [
      '-v',
      '0',
      '-select_streams',
      'a:0',
      '-show_entries',
      'stream=bits_per_sample,sample_rate,duration',
      '-of',
      'compact=p=0:nk=1',
      filePath
    ])

    ffprobe.stdout.on('data', (data) => {
      //console.log(`stdout:\n${data}`);
      const dataInArr = data.toString('utf8').split('|')
      const dataInArrFin = dataInArr.map((el) => {
        return +el.replace(/(\r\n|\n|\r)/gm, '')
      })
      //console.log('dataInArrFin', dataInArrFin);
      // const dataAsNum = +data

      const result = {
        success: true,
        message: 'file sampleRate and bitsPerSample is OK',
        data: {
          sampleRate: dataInArrFin[0],
          bitsPerSample: dataInArrFin[1],
          duration: dataInArrFin[2]
        }
      }

      resolve(result)
    })

    ffprobe.stderr.on('data', (data) => {
      //console.error(`stderr: ${data}`);
    })

    ffprobe.on('error', (error) => {
      //console.error(`error: ${error.message}`);
    })

    ffprobe.on('close', (code) => {
      //console.log(`child process exited with code ${code}`);
    })
  }).then((result) => {
    return result
  })
}

async function createSpectro(filePath, filaname, folderSPECTRO) {
  if (!fs.existsSync(folderSPECTRO)) {
    fs.mkdirSync(folderSPECTRO)
  }
  return new Promise(function (resolve, reject) {
    let extension = extname(filaname)
    let name = basename(filaname, extension)
    /// ffpmeg
    let spectrogram = child_process.spawn(ffmpegPath, [
      '-i',
      filePath,
      `-lavfi`,
      `showspectrumpic=s=2560x640:mode=separate`,
      folderSPECTRO + '/' + name + '-spectro.png'
    ])

    /// sox
    ///let spectrogram = child_process.spawn('sox', [filePath, "-n spectrogram -o", folderSPECTRO + "/" + name + "-spectro.png"]);

    spectrogram
      .on('data', (err) => {
        //console.log("err:", new String(err));
      })
      .on('exit', (statusCode) => {
        if (statusCode === 0) {
          //console.log("createSpectro done");
          resolve(name)
        }
      })
  }).then((result) => {
    return result
  })
}

async function checkFileInTracklist(file, isRaw, discogsTracklist) {
  let filename

  if (isRaw) {
    filename = removeRawFromName(file.split('.').slice(0, -1).join('.'))
  } else {
    filename = file.split('.').slice(0, -1).join('.')
  }

  let trackData = discogsTracklist.find((tracklistItem) => {
    return filename.toUpperCase().trim() === tracklistItem.position.toUpperCase().trim()
  })

  return trackData
}

async function createFolders(rootFolder, releaseID) {
  // console.log("filesHandler ", format);

  const folderMAIN = `${rootFolder}/${releaseID}`
  const folderRESTORED = `${folderMAIN}/RESTORED/`
  const folderVISUAL = `${folderMAIN}/VISUAL/`
  const allFilesList = []

  if (!fs.existsSync(folderMAIN)) {
    fs.mkdirSync(folderMAIN)
  }
  if (!fs.existsSync(folderRESTORED)) {
    fs.mkdirSync(folderRESTORED)
  }
  if (!fs.existsSync(folderVISUAL)) {
    fs.mkdirSync(folderVISUAL)
  }

  const isFile = (fileName) => {
    if (fileName) {
      return fs.lstatSync(fileName).isFile()
    }
  }
  //// move RAW and RESTORED files
  for (const file of readdirSync(rootFolder)) {
    let ifFile = fs.lstatSync(rootFolder + file).isFile()
    const fileExt = extname(file)
    const name = basename(file, fileExt)
    if (ifFile && file[0] !== '.' && allowedAudioFormats.indexOf(fileExt) > -1) {
      allFilesList.push(file)
      renameSync(join(rootFolder, file), join(folderRESTORED, name + fileExt))
    }
    if (
      (ifFile && file[0] !== '.' && fileExt === '.jpg') ||
      fileExt === '.jpeg' ||
      fileExt === '.png'
    ) {
      renameSync(join(rootFolder, file), join(folderVISUAL, name + fileExt))
    }
  }
  console.log('filesHandler Done')
  return { folderMAIN, allFilesList }
}

function zipDirectory(sourceDir1, sourceDir2, outPath) {
  const archive = archiver('zip', { zlib: { level: 9 } })
  const stream = fs.createWriteStream(outPath)
  return new Promise((resolve, reject) => {
    archive
      .directory(sourceDir1, 'VISUAL')
      .directory(sourceDir2, 'RESTORED')
      .on('error', (err) => reject(err))
      .pipe(stream)

    stream.on('close', () => resolve())
    archive.finalize()
  })
}

module.exports = {
  checkFiles,
  getFilesSpectros,
  createFolders,
  zipDirectory,
  allowedAudioFormats,
  allowedVisualFormats
}
