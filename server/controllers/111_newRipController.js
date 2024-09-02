const fs = require('fs')
const path = require('path')
const { readdirSync, renameSync } = require('fs')
const { join, extname, basename } = require('path')
const Discogs = require('disconnect').Client
const db = new Discogs({
  consumerKey: 'EZWmCxdwZuUQCTmUbfRY',
  consumerSecret: 'tyoPkXCrZTCqIlFDaVIWeZkwTeMaCbSm'
}).database()
const child_process = require('child_process')
const sharp = require('sharp')
const { ByteVector, File, PictureType, Picture } = require('node-taglib-sharp')
//const newRipRootFolder = require("../config/config").newRipRootFolder;

// const ffmpeg = require('fluent-ffmpeg');

// //Get the paths to the packaged versions of the binaries we want to use
// const ffmpegPath = require('ffmpeg-static').replace(
//     'app.asar',
//     'app.asar.unpacked'
// );
// const ffprobePath = require('ffprobe-static').path.replace(
//     'app.asar',
//     'app.asar.unpacked'
// );

// console.log('ffmpegPath ', ffmpegPath)

// //tell the ffmpeg package where it can find the needed binaries.
// ffmpeg.setFfmpegPath(ffmpegPath);
// ffmpeg.setFfprobePath(ffprobePath);

let newRipRootFolder = undefined
let newRipRootFolderRESTORED = ''
let newRipRootFolderRAW = ''
let newRipRootFolderAUDIO = ''
let newRipRootFolderVISUAL = undefined
let newRipRootFolderVISUAL_ID = ''
let coverFile = ''
let previewCoverFile = ''
let previewCoverFileSmall = ''
const IMG_QUALITY = 50
const RESIZE_WIDTH = 900
const rawFileRate = '24/96000'
const restoredFileRate = '16/44100'

// let discogsRelease = {};
let discogsRelease = {}
let discogsTracklist = []
let allFilesList = []
let rawFilesList = []
let restoredFilesList = []
let allSpectroList = []

/// ffprobe -v 0 -select_streams a:0 -show_entries stream=duration -of compact=p=0:nk=1 /Users/viktorkusnir/fluent-ffmpeg/test/a1.aif

// async function testFFMPEG(filePath, rate) {
//   try {
//     const { ext, name, dir } = path.parse(filePath)
//     const proc = ffmpeg(filePath)
//     .format('flac')
//         .on('codecData', function(data) {
//             console.log('codecData ', data);
//         })
//         .on('end', function() {
//             console.log('file has been converted succesfully');
//         })
//         .on('error', function(err) {
//             console.log('an error happened: ' + err.message);
//         })
//         .on('progress', function({ percent }) {
//             console.log('progress percent: ' + percent);
//         })
//         .size('50%')
//         .save(`${dir}/${name}2.flac`)
// } catch (error) {
//     console.log(error)
// }

// }

const checkDropedFolder = async (req, res, next) => {
  const folder = req.body.folder
  // await testFFMPEG('/Users/viktorkusnir/apps/kx-archiver/test/a.aif')
  const getFiles = (dir) => {
    const visual = []
    const files = []
    const error = []
    const list = fs.readdirSync(dir)
    for (const file of list) {
      const fullPath = dir + '/' + file
      if (fs.statSync(fullPath).isDirectory()) {
        // console.log('isDirectory file ', file)
        if (file !== 'VISUAL') {
        } else {
          const list2 = fs.readdirSync(fullPath)
          for (const file of list2) {
            const fullPath2 = fullPath + '/' + file
            visual.push({
              filename: file,
              filepath: fullPath2
            })
          }
        }
      } else {
        const fileExt = extname(file)
        if ((file !== '.DS_Store' && fileExt === '.aiff') || fileExt === '.aif') files.push(file)
      }
    }
    if (!visual.length) error.push('VISUAL folder is missing')
    if (!files.length) error.push('AIFF files is missing')
    return { files, visual, error }
  }

  const folderFiles = getFiles(folder)

  res.json({
    success: true,
    files: folderFiles
  })

  // console.log('checkDropedFolder getFiles ', getFiles(folder))

  // const readdirSync = (p, a = []) => {
  //   if (fs.statSync(p).isDirectory())
  //     fs.readdirSync(p).map(f => readdirSync(a[a.push(path.join(p, f)) - 1], a))
  //   return a
  // }

  // console.log(readdirSync(folder))
}

////// parse Discogs and add tags
const parseRelease = async (req, res, next) => {
  const rip = req.body.rip
  newRipRootFolder = req.body.folder
  newRipRootFolderVISUAL = req.body.folder + '/VISUAL/'
  const projectID = rip.projectID
  const release = rip.releaseID
  const media = rip.media
  const sleeve = rip.sleeve
  const description = rip.description
  const needSpectro = rip.needSpectro
  const equipment = rip.equipment
  const postproduction = rip.postproduction
  const loudness = rip.loudness

  let artists
  let albumArtists
  let releaseArtists
  let releaseAlbum
  let formatName
  let formatDescription
  let year
  let inyear
  let country
  let incountry
  // let tracklist
  let trackCount
  let styles
  let styleAsString = []
  let discogsUri
  let lineageText
  let label
  let labelCatNo

  const ripFolder = projectID
  const ripFolderPath = newRipRootFolder + ripFolder + '/'

  //// Get Discogs
  const discogsRelease = await getReleaseData(release)
  discogsTracklist = discogsRelease.tracklist

  console.log('discogsTracklist ', discogsTracklist)

  /// Create folder
  if (!fs.existsSync(ripFolderPath)) {
    fs.mkdirSync(ripFolderPath)
  }

  /// Parse Meta Tags files
  let formatNameFirst = discogsRelease.formats[0].name

  if (formatNameFirst == 'Vinyl' || formatNameFirst == 'Cassette') {
    await filesCheckerVinyl(formatNameFirst, needSpectro, ripFolderPath)
  } else {
    await filesCheckerNotVinyl(formatNameFirst, needSpectro, ripFolderPath)
  }

  /// Create Cover
  //createCoverImage()

  //// pathToPic
  let result = discogsRelease
  let pathToPic = ripFolderPath + 'VISUAL/Front.jpg'

  try {
    if (!fs.existsSync(pathToPic)) {
      pathToPic = ripFolderPath + 'VISUAL/A.jpg'
    }
  } catch (err) {
    console.error(err)
  }

  /// Format name
  formatName = result.formats != undefined ? result.formats[0].name : ''
  formatDescription =
    result.formats != undefined && result.formats[0].descriptions != undefined
      ? result.formats[0].descriptions[0]
      : ''

  /// Label
  label = result.labels != undefined ? result.labels[0].name : ''
  labelCatNo = result.labels != undefined ? result.labels[0].catno : ''

  //// Release Artist
  releaseArtists = artistNameHandler(result.artists[0].name)
  releaseAlbum = result.title

  //// styles
  styles = result.styles ? result.styles : result.genres
  styleAsString.push(styles.join(', '))

  //// year handler
  year = result.year == 0 || result.year == undefined ? '' : result.year
  inyear = result.year == 0 || result.year == undefined ? '' : 'in ' + result.year + ' '

  //// country handler
  country = result.country == 0 || result.country == undefined ? '---' : result.country
  incountry = result.country == 0 || result.country == undefined ? '' : 'in ' + result.country + ' '

  /// uri
  discogsUri = result.uri

  /// Count
  trackCount = discogsTracklist.length

  const releaseDataFinal = {
    artist: releaseArtists,
    title: releaseAlbum,
    year: year,
    country: country,
    styles: styles,
    format: formatName,
    formatDescription: formatDescription,
    tracklist: discogsTracklist,
    label: label,
    labelCatNo: labelCatNo,
    styleAsString: styleAsString,
    discogsUri: discogsUri,
    projectID: projectID,
    media: media,
    sleeve: sleeve,
    trackCount: trackCount
  }

  if (formatName == 'Vinyl' || formatName == 'Cassette') {
    //// RESTORED folder
    await filesHandlerRESTORED(releaseDataFinal, pathToPic)

    //// RAW folder
    await filesHandlerRAW(releaseDataFinal)
  } else {
    //// AUDIO folder
    await filesHandlerAUDIO(releaseDataFinal, pathToPic)
  }

  //// Lineage File
  const lineageFile = await createLineageFile(rip, releaseDataFinal, ripFolderPath)
  res.json(lineageFile)

  /// Convert to Flac

  //// Rename Folder
  renameFolderFinal(releaseDataFinal, ripFolderPath)
}

function createLineageFile(rip, releaseDataFinal, ripFolderPath) {
  return new Promise(function (resolve, reject) {
    //// lineageText
    lineageText =
      `Release info:\r\n\r\n` +
      `Release: ${releaseDataFinal.artist} - ${releaseDataFinal.title}\r\n` +
      `Format: ${releaseDataFinal.format}, ${releaseDataFinal.formatDescription}\r\n` +
      `Label: ${releaseDataFinal.label} – ${releaseDataFinal.labelCatNo}\r\n` +
      `Origin: ${releaseDataFinal.country}\r\n` +
      `Style: ${releaseDataFinal.styleAsString}\r\n` +
      `Year: ${releaseDataFinal.year}\r\n\r\n` +
      `Discogs link: ${releaseDataFinal.discogsUri}\r\n\r\n` +
      `Item condition: ${releaseDataFinal.media}/${releaseDataFinal.sleeve}\r\n\r\n` +
      `Cleaning, processing and postproduction had been executed at the KollektivX Sound Lab.\r\n\r\n` +
      `24/96 RAW (FLAC)\r\n` +
      `16/44.1 RESTORED (FLAC)\r\n\r\n` +
      `ATTENTION: KollektivX may insert hidden identifiers that uniquely identifies it as the copy you received from the Company.\r\n\r\n` +
      `PLEASE NOTE THAT YOU MAY OWN A DIGITAL COPY OF THE ITEMS AS LONG AS YOU OWN THE PHYSICAL MEDIA. YOU ARE SOLELY RESPONSIBLE FOR COPYRIGHT COMPLIANCE.\r\n\r\n` +
      `In particular, any unauthorised use of copyright protected material (including by way of reproduction, distribution, modification, adaptation, public display, public performance, preparation of derivative works, making available or otherwise communicating to the public) may constitute an infringement of third party rights. Any such infringements may also result in civil litigation or criminal prosecution by or on behalf of the relevant rights holder.\r\n\r\n` +
      `KX#${releaseDataFinal.projectID}`

    //// lineage file create
    fs.writeFile(ripFolderPath + 'Lineage KollektivX.txt', lineageText, function (err) {
      if (err) return console.log(err)
      console.log('Lineage KollektivX.txt done ', ripFolderPath)

      const result = {
        success: true,
        releaseData: releaseDataFinal,
        rawFilesList: rawFilesList,
        restoredFilesList: restoredFilesList,
        allFilesList: allFilesList
      }

      resolve(result)

      allFilesList = []
      rawFilesList = []
      restoredFilesList = []
      releaseDataFinal = {}
    })
  }).then((result) => {
    return result
  })
}

async function filesHandlerRESTORED(releaseDataFinal, pathToPic) {
  const {
    artist,
    title,
    year,
    media,
    sleeve,
    styleAsString,
    trackCount,
    format,
    formatDescription,
    tracklist
  } = releaseDataFinal
  try {
    const files = fs.readdirSync(newRipRootFolderRESTORED)
    console.log('readdirSync files ', files)
    let index = 0
    for (const file of files) {
      console.log('file ', file)
      const indexTrack = index + 1
      const filename = file.split('.').slice(0, -1).join('.')
      const fileExt = extname(file)
      console.log('filename ', filename)
      console.log('fileExt ', fileExt)

      if (file !== '.DS_Store') {
        const trackData = tracklist.find((tracklistItem) => {
          return filename.toUpperCase().trim() === tracklistItem.position.toUpperCase().trim()
        })

        //// если есть совпадение
        console.log('filesHandlerRESTORED есть совпадение? ', trackData)
        if (trackData) {
          if (trackData.position != '') {
            const trackArtist = trackData.artists
              ? artistNameHandler(trackData.artists[0].name)
              : artist
            if (trackData.extraartists != undefined) {
              console.log(trackData.extraartists[0].role + ' by ' + trackData.extraartists[0].name)
            }
            const trackTitle = trackData.title.replace(/\//g, '-')
            const tagsData = {
              trackTitle: trackTitle,
              releaseAlbum: title,
              artists: trackArtist,
              albumArtists: artist,
              styleAsString: styleAsString,
              year: year,
              indexTrack: indexTrack,
              trackCount: trackCount,
              media: media,
              sleeve: sleeve,
              formatName: format,
              formatDescription: formatDescription
            }
            const oldPath = newRipRootFolderRESTORED + file
            const newFilename = trackData.position.trim() + '. ' + trackTitle + fileExt
            const newPath = newRipRootFolderRESTORED + newFilename

            try {
              fs.renameSync(oldPath, newPath)
              console.log('filesHandlerRESTORED Successfully renamed the directory.')
            } catch (err) {
              console.log(err)
            }
            await addID3Tags(newPath, pathToPic, tagsData)
            await convertToFlac(newPath, newFilename, newRipRootFolderRESTORED)
          }
        } else {
          const tagsData = {
            trackTitle: '',
            releaseAlbum: title,
            artists: [artist],
            albumArtists: [artist],
            styleAsString: styleAsString,
            year: year,
            indexTrack: indexTrack,
            trackCount: trackCount,
            media: media,
            sleeve: sleeve,
            formatName: format,
            formatDescription: formatDescription
          }

          const newPath = newRipRootFolderRESTORED + file
          await addID3Tags(newPath, pathToPic, tagsData)
          await convertToFlac(newPath, filename, newRipRootFolderRESTORED)
        }
      }
    }
  } catch (error) {
    console.log('RESTORED rename error: ', error)
  }
}

async function filesHandlerRAW(releaseDataFinal) {
  const { tracklist } = releaseDataFinal
  const files = fs.readdirSync(newRipRootFolderRAW)
  console.log('readdirSync files ', files)
  for (const file of files) {
    const filename = removeRawFromName(file.split('.').slice(0, -1).join('.'))
    const fileExt = extname(file)
    if (file != '.DS_Store') {
      const trackData = tracklist.find((tracklistItem) => {
        return (
          filename.toUpperCase().split(' ')[0].trim() ===
          tracklistItem.position.toUpperCase().trim()
        )
      })
      console.log('filesHandlerRAW есть совпадение? ', trackData)
      if (trackData) {
        const trackTitle = trackData.title.replace(/\//g, '-')
        if (trackData.position != '') {
          const oldPath = newRipRootFolderRAW + file
          const newFilename = trackData.position.trim() + '. ' + trackTitle + fileExt
          const newPath = newRipRootFolderRAW + newFilename
          try {
            fs.renameSync(oldPath, newPath)
            console.log('newRipRootFolderRAW Successfully renamed the directory.')
          } catch (err) {
            console.log(err)
          }
          await convertToFlac(newPath, newFilename, newRipRootFolderRAW)
        }
      }
    }
  }
}

async function filesHandlerAUDIO(releaseDataFinal, pathToPic) {
  const {
    artist,
    title,
    year,
    media,
    sleeve,
    styleAsString,
    trackCount,
    format,
    formatDescription,
    tracklist
  } = releaseDataFinal
  try {
    const files = fs.readdirSync(newRipRootFolderAUDIO)
    console.log('readdirSync files ', files)
    let index = 0
    for (const file of files) {
      //console.log('file ', file);
      const indexTrack = index + 1
      const filename = file.split('.').slice(0, -1).join('.')
      const fileExt = extname(file)
      if (file != '.DS_Store') {
        const trackData = tracklist.find((tracklistItem) => {
          return filename.toUpperCase().trim() === tracklistItem.position.toUpperCase().trim()
        })
        //// если есть совпадение
        if (trackData) {
          if (trackData.position != '') {
            if (trackData.artists) {
              artists = artistNameHandler(trackData.artists[0].name)
              albumArtists = artist
            } else {
              artists = artist
              albumArtists = artist
            }

            if (trackData.extraartists != undefined) {
              console.log(trackData.extraartists[0].role + ' by ' + trackData.extraartists[0].name)
            }
            const trackTitle = trackData.title.replace(/\//g, '-')

            const tagsData = {
              trackTitle: trackTitle,
              releaseAlbum: title,
              artists: trackArtist,
              albumArtists: artist,
              styleAsString: styleAsString,
              year: year,
              indexTrack: indexTrack,
              trackCount: trackCount,
              media: media,
              sleeve: sleeve,
              formatName: format,
              formatDescription: formatDescription
            }

            const oldPath = newRipRootFolderAUDIO + file
            const newFilename = trackData.position.trim() + '. ' + trackTitle + fileExt
            const newPath = newRipRootFolderAUDIO + newFilename

            try {
              fs.renameSync(oldPath, newPath)
            } catch (err) {
              console.log(err)
            }
            await addID3Tags(newPath, pathToPic, tagsData)
            await convertToFlac(newPath, filename, newRipRootFolderAUDIO)
          }
        } else {
          const tagsData = {
            trackTitle: '',
            releaseAlbum: releaseAlbum,
            artists: [artist],
            albumArtists: [artist],
            styleAsString: styleAsString,
            year: year,
            indexTrack: indexTrack,
            trackCount: trackCount
          }

          const newPath = newRipRootFolderAUDIO + file
          await addID3Tags(newPath, pathToPic, tagsData)
          await convertToFlac(newPath, filename, newRipRootFolderAUDIO)
        }
      }
    }
  } catch (error) {
    console.log('RESTORED rename error: ', error)
  }
}

function renameFolderFinal(releaseDataFinal, ripFolderPath) {
  const newRipFolderPath =
    newRipRootFolder +
    releaseDataFinal.artist.replaceAll('/', '\u2215') +
    ' - ' +
    releaseDataFinal.title.replaceAll('/', '\u2215') +
    ' (KX#' +
    releaseDataFinal.projectID +
    ')'
  try {
    fs.renameSync(ripFolderPath, newRipFolderPath)
    console.log('Successfully renamed the directory.')
  } catch (err) {
    console.log(err)
  }
}

function createCoverImage() {
  coverFile = fs.existsSync(ripFolderPath + 'VISUAL/Front.jpg')
    ? ripFolderPath + 'VISUAL/Front.jpg'
    : ripFolderPath + 'VISUAL/A.jpg'
  console.log('coverFile ', coverFile)
  previewCoverFile = ripFolderPath + 'cover.jpg'
  previewCoverFileSmall = ripFolderPath + 'cover-small.jpg'
  let createCoverResult = createCover(coverFile, previewCoverFile, previewCoverFileSmall)
  return createCoverResult
}

function base64_encode(file) {
  return 'data:image/gif;base64,' + fs.readFileSync(file, 'base64')
}

async function checkFiles(folder, audioFiles, rate, isRaw) {
  console.log('checkFiles ', audioFiles, folder)

  for (const audioFile of audioFiles) {
    let fileData = await parseFileMetadataFFMPEG(folder + '/' + audioFile, rate)
    let fileSpectro = await createSpectro(folder + '/' + audioFile, audioFile)
    let fileInTracklist = await checkFileInTracklist(audioFile, isRaw)

    console.log('fileData ', fileData)
    console.log('rate ', rate)
    console.log('fileInTracklist ', fileInTracklist)

    const extension = extname(audioFile)
    const name = basename(audioFile, extension)
    const spectroBase64 = base64_encode(newRipRootFolder + '/' + name + '-spectro.png')

    if (rate === rawFileRate) {
      rawFilesList.push({
        file: audioFile,
        filename: name,
        spectro: spectroBase64,
        rateIsOk: fileData.success,
        rateData: fileData.data,
        message: fileData.message,
        fileInTracklist: fileInTracklist
      })
    }

    if (rate === restoredFileRate) {
      restoredFilesList.push({
        file: audioFile,
        filename: name,
        spectro: spectroBase64,
        rateIsOk: fileData.success,
        rateData: fileData.data,
        message: fileData.message,
        fileInTracklist: fileInTracklist
      })
    }

    //console.log('fileData ', fileData);
  }
  return true
}

async function parseFileMetadataFFMPEG(filePath, rate) {
  return new Promise(function (resolve, reject) {
    console.log('parseFileMetadataFFMPEG ', filePath)

    const fileMetaData = {
      sampleRate: null,
      bitsPerSample: null,
      duration: null
    }

    const ffprobe = child_process.spawn('ffprobe', [
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
      console.log(`stdout:\n${data}`)
      const dataInArr = data.toString('utf8').split('|')
      const dataInArrFin = dataInArr.map((el) => {
        return +el.replace(/(\r\n|\n|\r)/gm, '')
      })
      console.log('dataInArrFin', dataInArrFin)
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
      console.error(`stderr: ${data}`)
    })

    ffprobe.on('error', (error) => {
      console.error(`error: ${error.message}`)
    })

    ffprobe.on('close', (code) => {
      console.log(`child process exited with code ${code}`)
    })
  }).then((result) => {
    return result
  })
}

async function parseFileMetadata(file, rate) {
  let result
  try {
    const metadata = await mm.parseFile(file)

    //console.log('qqq ', metadata.format.bitsPerSample+'/'+metadata.format.sampleRate)

    if (rate === metadata.format.bitsPerSample + '/' + metadata.format.sampleRate) {
      result = {
        success: true,
        message: 'file sampleRate and bitsPerSample is OK',
        data: {
          sampleRate: metadata.format.sampleRate,
          bitsPerSample: metadata.format.bitsPerSample,
          duration: metadata.format.duration
        }
      }
    } else {
      result = {
        success: false,
        message: 'file sampleRate and bitsPerSample is WRONG',
        data: {
          sampleRate: metadata.format.sampleRate,
          bitsPerSample: metadata.format.bitsPerSample,
          duration: metadata.format.duration
        }
      }
    }
  } catch (error) {
    console.error(error.message)
    result = {
      success: false,
      message: error.message,
      data: {}
    }
  }
  return result
}

function removeRawFromName(str) {
  return str.substring(0, str.toUpperCase().trim().indexOf('RAW'))
}

async function checkFileInTracklist(file, isRaw) {
  let filename

  if (isRaw) {
    filename = removeRawFromName(file.split('.').slice(0, -1).join('.'))
  } else {
    filename = file.split('.').slice(0, -1).join('.')
  }

  let trackData = discogsTracklist.find((tracklistItem) => {
    console.log('checkFileInTracklist filename', filename)
    console.log('checkFileInTracklist tracklistItem.position', tracklistItem.position)
    return filename.toUpperCase().trim() === tracklistItem.position.toUpperCase().trim()
  })

  return trackData
}

async function createSpectro(filePath, filaname) {
  return new Promise(function (resolve, reject) {
    let extension = extname(filaname)
    let name = basename(filaname, extension)
    let spectrogram = child_process.spawn('ffmpeg', [
      '-i',
      filePath,
      `-lavfi`,
      `showspectrumpic=s=4096x1024:mode=separate`,
      newRipRootFolder + '/' + name + '-spectro.png'
    ])
    //let spectrogram = child_process.spawn('sox', [filePath, `-n spectrogram -o`, newRipRootFolder + '/' + name + '-spectro.png']);

    spectrogram
      .on('data', (err) => {
        console.log('err:', new String(err))
      })
      .on('exit', (statusCode) => {
        //console.log('statusCode: '+statusCode);
        if (statusCode === 0) {
          console.log('createSpectro done')
          allSpectroList.push(filaname + '-spectro.png')
          if (allSpectroList.length === allFilesList.length) {
            console.log('ALL createSpectro DONE')
          }
          resolve('createSpectro done')
        }
      })
  }).then((result) => {
    return result
  })
}

async function convertToFlac(filePath, filaname, dir) {
  console.log('convertToFlac ', filePath, filaname, dir)
  return new Promise(function (resolve, reject) {
    console.log('createSpectro ', filePath)
    let extension = extname(filaname)
    let name = basename(filaname, extension)
    //ffmpeg -i A.aif -c:a flac audio.flac
    let convert = child_process.spawn('ffmpeg', [
      '-i',
      filePath,
      `-c:a`,
      `flac`,
      dir + '/' + name + '.flac'
    ])
    //let spectrogram = child_process.spawn('sox', [filePath, `-n spectrogram -o`, newRipRootFolder + '/' + name + '-spectro.png']);

    convert
      .on('data', (err) => {
        console.log('err:', new String(err))
      })
      .on('exit', (statusCode) => {
        //console.log('statusCode: '+statusCode);
        if (statusCode === 0) {
          console.log('convertToFlac done')
          /// remove aiff

          try {
            fs.unlinkSync(filePath)
            console.log('remove aiff successfully.')
          } catch (error) {
            console.log(error)
          }

          resolve('convertToFlac done')
        }
      })
  }).then((result) => {
    return result
  })
}

/// remove artist count from name
function artistNameHandler(str) {
  function isNumber(n) {
    return Number(n) === n
  }
  let result
  let afterName = str.substring(str.indexOf('(') + 1, str.lastIndexOf(')'))
  if (afterName && isNumber(+afterName)) {
    result = str.substring(0, str.indexOf('(') - 1)
  } else {
    result = str
  }
  return result
}

async function filesCheckerVinyl(format, needSpectro, ripFolderPath) {
  console.log('filesHandler ', format)

  newRipRootFolderRAW = ripFolderPath + '/RAW/'
  newRipRootFolderRESTORED = ripFolderPath + '/RESTORED/'
  newRipRootFolderVISUAL_ID = ripFolderPath + '/VISUAL/'

  if (!fs.existsSync(newRipRootFolderRAW)) {
    fs.mkdirSync(newRipRootFolderRAW)
  }
  if (!fs.existsSync(newRipRootFolderRESTORED)) {
    fs.mkdirSync(newRipRootFolderRESTORED)
  }

  try {
    fs.renameSync(newRipRootFolderVISUAL, newRipRootFolderVISUAL_ID)
  } catch (err) {
    console.log(err)
  }

  const isFile = (fileName) => {
    if (fileName) {
      return fs.lstatSync(fileName).isFile()
    }
  }
  //// move RAW and RESTORED files
  for (const file of readdirSync(newRipRootFolder)) {
    let ifFile = fs.lstatSync(newRipRootFolder + file).isFile()
    const fileExt = extname(file)
    const name = basename(file, fileExt)
    if ((ifFile && file != '.DS_Store' && fileExt === '.aiff') || fileExt === '.aif') {
      allFilesList.push(file)
      if (file.indexOf('raw') > -1 || file.indexOf('Raw') > -1 || file.indexOf('RAW') > -1) {
        renameSync(join(newRipRootFolder, file), join(newRipRootFolderRAW, name + fileExt))
      } else {
        renameSync(join(newRipRootFolder, file), join(newRipRootFolderRESTORED, name + fileExt))
      }
    }
  }

  console.log('filesHandler needSpectro', needSpectro)
  if (needSpectro) {
    const filesRAW = fs.readdirSync(newRipRootFolderRAW)
    await checkFiles(newRipRootFolderRAW, filesRAW, rawFileRate, true)

    const filesRESTORED = fs.readdirSync(newRipRootFolderRESTORED)
    await checkFiles(newRipRootFolderRESTORED, filesRESTORED, restoredFileRate, false)
  }

  console.log('filesHandler Done')
  return true
}

async function filesCheckerNotVinyl(format, needSpectro, ripFolderPath) {
  console.log('filesHandler ', format)

  newRipRootFolderVISUAL_ID = ripFolderPath + '/VISUAL/'
  newRipRootFolderAUDIO = ripFolderPath + '/AUDIO/'

  if (!fs.existsSync(newRipRootFolderAUDIO)) {
    fs.mkdirSync(newRipRootFolderAUDIO)
  }

  try {
    fs.renameSync(newRipRootFolderVISUAL, newRipRootFolderVISUAL_ID)
  } catch (err) {
    console.log(err)
  }

  const isFile = (fileName) => {
    if (fileName) {
      return fs.lstatSync(fileName).isFile()
    }
  }
  //// move RAW and RESTORED files
  for (const file of readdirSync(newRipRootFolder)) {
    let ifFile = fs.lstatSync(newRipRootFolder + file).isFile()
    const fileExt = extname(file)
    const name = basename(file, fileExt)
    if ((ifFile && file != '.DS_Store' && fileExt === '.aiff') || fileExt === '.aif') {
      allFilesList.push(file)
      renameSync(join(newRipRootFolder, file), join(newRipRootFolderAUDIO, name + fileExt))
    }
  }

  if (needSpectro) {
    const filesAUDIO = fs.readdirSync(newRipRootFolderAUDIO)
    await checkFiles(newRipRootFolderAUDIO, filesAUDIO, restoredFileRate)
  }

  console.log('filesHandler Done')
  return true
}

const getReleaseTracklist = (req, res, next) => {
  const releaseID = req.body.releaseID
  const projectID = req.body.projectID
  console.log('getReleaseTracklist ', releaseID, projectID)
  new Promise(function (resolve, reject) {
    const result = getReleaseData(releaseID)
    resolve(result)
  }).then((result) => {
    let artist = artistNameHandler(result.artists[0].name)
    let title = result.title
    let tracklist = result.tracklist
    let format = result.formats != undefined ? result.formats[0].name : ''

    console.log('getReleaseTracklist tracklist', tracklist)
    console.log('getReleaseTracklist format', format)

    Rip.findOne(
      {
        projectID: projectID
      },
      (err, item) => {
        if (err) {
          res.sendStatus(500)
        } else {
          console.log('item', item)
          if (item) {
            item.tracklist = [...tracklist]

            if (item.releaseID == '') {
              item.releaseID = releaseID
            }
            if (!item.artist) {
              item.artist = artist
              item.title = title
            }

            if (!item.format) {
              item.format = format
            }

            item.save((err, data) => {
              if (err) {
                console.log(err)
              } else {
                console.log('rip tracklist added')
                //console.log('api get-rips ', rips)
                res.send({
                  success: true,
                  message: 'rip tracklist added'
                })
              }
            })
          }
        }
      }
    )
  })
}

function addID3Tags(path, pathToPic, tagsData) {
  /// tagsData = { trackTitle, releaseAlbum, artists, albumArtists, styleAsString, year, indexTrack, trackCount, media, sleeve, formatName, formatDescription  }
  return new Promise(function (resolve, reject) {
    console.log('addID3Tags path ', path)
    console.log('addID3Tags pathToPic ', pathToPic)
    console.log('addID3Tags tagsData ', tagsData)
    const {
      trackTitle,
      releaseAlbum,
      artists,
      albumArtists,
      styleAsString,
      year,
      indexTrack,
      trackCount,
      media,
      sleeve,
      formatName,
      formatDescription
    } = tagsData

    try {
      const myFile = File.createFromPath(path)
      const pic = {
        data: ByteVector.fromPath(pathToPic),
        mimeType: 'image/jpeg',
        type: PictureType.FrontCover,
        filename: 'Cover.jpg',
        description: 'Cover.jpg'
      }
      myFile.tag.pictures = [pic]
      myFile.tag.title = trackTitle
      myFile.tag.album = releaseAlbum
      myFile.tag.performers = [artists]
      myFile.tag.albumArtists = [albumArtists]
      myFile.tag.genres = styleAsString
      if (year) {
        myFile.tag.year = year
      }
      myFile.tag.comment = `Archived by KollektivX. ${formatName}, ${formatDescription}. ${media}/${sleeve}`
      myFile.tag.track = indexTrack
      myFile.tag.trackCount = trackCount

      myFile.save()
      myFile.dispose()
      resolve('addID3Tags done')
    } catch (err) {
      console.error(err)
    }

    //convertToFlacFFmpeg(path, newRipRootFolderRESTORED+'/'+trackTitle+'.flac')
  }).then((result) => {
    return result
  })
}

async function createCover(coverFile, previewCoverFile, previewCoverFileSmall) {
  ///// create cover.jpg
  try {
    fs.copyFileSync(coverFile, previewCoverFile)

    // await createCoverSmall(previewCoverFile, previewCoverFileSmall);
    await sharp(previewCoverFile)
      .resize(RESIZE_WIDTH, RESIZE_WIDTH)
      .jpeg({
        quality: IMG_QUALITY
      })
      .toFile(previewCoverFileSmall)
      .then((info) => {
        console.log(info)
        fs.unlinkSync(previewCoverFile)
        return true
      })
      .catch((err) => {
        console.log(err)
        return false
      })
  } catch (err) {
    console.log(err)
  }
}

async function getArtistData(artists) {
  const artist_data = []
  for (const artist of artists) {
    try {
      const getArtist = await db.getArtist(artist.id)
      if (getArtist.members) {
        getArtist.members.map((member) => artist_data.push(member))
      } else {
        artist_data.push({
          name: getArtist.name,
          id: getArtist.id
        })
      }
    } catch (err) {
      console.log('getArtist err ', err)
    }
  }
  return artist_data
}

async function getReleaseData(releaseID) {
  try {
    const discogsRelease = await db.getRelease(releaseID)
    discogsRelease.artist_data = await getArtistData(discogsRelease.artists)
    discogsRelease.tracklist = discogsRelease.tracklist.filter((tracklistItem) => {
      return tracklistItem.position !== ''
    })
    return discogsRelease
  } catch (err) {
    console.log('error ', err)
    return false
  }
}

module.exports = {
  checkDropedFolder,
  parseRelease,
  getReleaseTracklist
}
