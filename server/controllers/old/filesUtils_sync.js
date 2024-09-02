const fs = require('fs')
const { join, extname, basename } = require('path')
const child_process = require('child_process')
const ffmpegPath = '/usr/local/bin/ffmpeg'
const ffprobePath = '/usr/local/bin/ffprobe'
const { removeRawFromName, base64_encode } = require('./utils')

async function checkFiles(rawData, restoredData, GLOBAL) {
  //const { folder, audioFiles, rate, isRaw } = rawData
  //console.log("checkFiles ", audioFiles, folder);
  return new Promise(function (resolve, reject) {
    const rawFilesCount = rawData.audioFiles.length
    const restoredFilesCount = restoredData.audioFiles.length

    let rawFilesList = []
    let restoredFilesList = []

    function checkIfAllDone() {
      return (
        rawFilesList.length === rawFilesCount && restoredFilesList.length === restoredFilesCount
      )
    }

    async function startRAW() {
      for (const audioFile of rawData.audioFiles) {
        let fileData = await parseMetadata(rawData.folder + '/' + audioFile, rawData.rate)
        let allSpectroList = await createSpectro(
          rawData.folder + '/' + audioFile,
          audioFile,
          GLOBAL
        )
        let fileInTracklist = await checkFileInTracklist(audioFile, rawData.isRaw, GLOBAL)

        const extension = extname(audioFile)
        const name = basename(audioFile, extension)
        //const spectroBase64 = base64_encode(GLOBAL.rootFolder + "/" + name + "-spectro.png");

        rawFilesList.push({
          file: audioFile,
          filename: name,
          spectro: GLOBAL.rootFolder + '/' + name + '-spectro.png',
          rateIsOk: fileData.success,
          rateData: fileData.data,
          message: fileData.message,
          fileInTracklist: fileInTracklist
        })

        if (checkIfAllDone()) {
          resolve({ rawFilesList, restoredFilesList })
        }
      }
    }
    async function startRESTORED() {
      for (const audioFile of restoredData.audioFiles) {
        let fileData = await parseMetadata(restoredData.folder + '/' + audioFile, restoredData.rate)
        let allSpectroList = await createSpectro(
          restoredData.folder + '/' + audioFile,
          audioFile,
          GLOBAL
        )
        let fileInTracklist = await checkFileInTracklist(audioFile, restoredData.isRaw, GLOBAL)

        const extension = extname(audioFile)
        const name = basename(audioFile, extension)
        //const spectroBase64 = base64_encode(GLOBAL.rootFolder + "/" + name + "-spectro.png");

        restoredFilesList.push({
          file: audioFile,
          filename: name,
          spectro: GLOBAL.rootFolder + '/' + name + '-spectro.png',
          rateIsOk: fileData.success,
          rateData: fileData.data,
          message: fileData.message,
          fileInTracklist: fileInTracklist
        })

        if (checkIfAllDone()) {
          resolve({ rawFilesList, restoredFilesList })
        }
      }
    }

    startRAW()
    startRESTORED()
  }).then((result) => {
    console.log('result ', result)
    return result
  })
}

async function parseMetadata(filePath, rate) {
  return new Promise(function (resolve, reject) {
    //console.log("parseMetadata ", filePath);

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

async function createSpectro(filePath, filaname, GLOBAL) {
  let allSpectroList = []
  return new Promise(function (resolve, reject) {
    let extension = extname(filaname)
    let name = basename(filaname, extension)
    let spectrogram = child_process.spawn(ffmpegPath, [
      '-i',
      filePath,
      `-lavfi`,
      `showspectrumpic=s=2560x640:mode=separate`,
      GLOBAL.rootFolder + '/' + name + '-spectro.png'
    ])
    //let spectrogram = child_process.spawn('sox', [filePath, `-n spectrogram -o`, GLOBAL.rootFolder + '/' + name + '-spectro.png']);

    spectrogram
      .on('data', (err) => {
        //console.log("err:", new String(err));
      })
      .on('exit', (statusCode) => {
        if (statusCode === 0) {
          //console.log("createSpectro done");
          resolve(true)
        }
      })
  }).then((result) => {
    return result
  })
}

async function checkFileInTracklist(file, isRaw, GLOBAL) {
  let filename

  if (isRaw) {
    filename = removeRawFromName(file.split('.').slice(0, -1).join('.'))
  } else {
    filename = file.split('.').slice(0, -1).join('.')
  }

  let trackData = GLOBAL.discogsTracklist.find((tracklistItem) => {
    return filename.toUpperCase().trim() === tracklistItem.position.toUpperCase().trim()
  })

  return trackData
}

module.exports = {
  checkFiles
}
