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
    const state = {
      count: 0,
      results: []
    }

    let rawFilesList = rawData.audioFiles.map((el) => {
      return { file: el }
    })
    let restoredFilesList = restoredData.audioFiles.map((el) => {
      return { file: el }
    })

    function checkIfAllDone() {
      return state.count === 2
    }

    async function startRAW() {
      const listOfPromises1 = rawData.audioFiles.map((audioFile) => {
        return parseMetadata(rawData.folder + '/' + audioFile, rawData.rate)
      })
      const listOfPromises2 = rawData.audioFiles.map((audioFile) => {
        return createSpectro(rawData.folder + '/' + audioFile, audioFile, GLOBAL)
      })
      const listOfPromises3 = rawData.audioFiles.map((audioFile) => {
        return checkFileInTracklist(audioFile, rawData.isRaw, GLOBAL)
      })

      let fileDatas = await Promise.all(listOfPromises1)
      fileDatas.forEach((fileData, index) => {
        rawFilesList[index].rateIsOk = fileData.success
        rawFilesList[index].rateData = fileData.data
        rawFilesList[index].message = fileData.message
      })

      let spectros = await Promise.all(listOfPromises2)
      spectros.forEach((name, index) => {
        rawFilesList[index].filename = name
        rawFilesList[index].spectro = GLOBAL.rootFolder + '/' + name + '-spectro.png'
      })

      let filesInTracklist = await Promise.all(listOfPromises3)
      filesInTracklist.forEach((fileInTracklist, index) => {
        rawFilesList[index].fileInTracklist = fileInTracklist
      })

      console.log('rawFilesList ', rawFilesList)
      state.count += 1

      if (checkIfAllDone()) {
        resolve({ rawFilesList, restoredFilesList })
      }
    }
    async function startRESTORED() {
      const listOfPromises1 = restoredData.audioFiles.map((audioFile) => {
        return parseMetadata(restoredData.folder + '/' + audioFile, restoredData.rate)
      })
      const listOfPromises2 = restoredData.audioFiles.map((audioFile) => {
        return createSpectro(restoredData.folder + '/' + audioFile, audioFile, GLOBAL)
      })
      const listOfPromises3 = restoredData.audioFiles.map((audioFile) => {
        return checkFileInTracklist(audioFile, restoredData.isRaw, GLOBAL)
      })

      let fileDatas = await Promise.all(listOfPromises1)
      fileDatas.forEach((fileData, index) => {
        restoredFilesList[index].rateIsOk = fileData.success
        restoredFilesList[index].rateData = fileData.data
        restoredFilesList[index].message = fileData.message
      })

      let spectros = await Promise.all(listOfPromises2)
      spectros.forEach((name, index) => {
        restoredFilesList[index].filename = name
        restoredFilesList[index].spectro = GLOBAL.rootFolder + '/' + name + '-spectro.png'
      })

      let filesInTracklist = await Promise.all(listOfPromises3)
      filesInTracklist.forEach((fileInTracklist, index) => {
        restoredFilesList[index].fileInTracklist = fileInTracklist
      })

      state.count += 1

      if (checkIfAllDone()) {
        resolve({ rawFilesList, restoredFilesList })
      }
    }

    startRAW()
    startRESTORED()
  }).then((result) => {
    console.log('checkFiles result ', result)
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
          resolve(name)
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
