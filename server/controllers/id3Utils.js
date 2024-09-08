const fs = require('fs')
const { join, extname, basename } = require('path')
const { ByteVector, File, PictureType, Picture } = require('node-taglib-sharp')
const child_process = require('child_process')
const path = require('path')
// const ffmpegPath = '/usr/local/bin/ffmpeg'
const {
  prepareReleaseData,
  removeRawFromName,
  checkFileInTracklist,
  base64_encode,
  artistNameHandler
} = require('./utils')
const mm = require('music-metadata')
const log = require('electron-log')
const electron = require('electron')
const ffbinaries = require('ffbinaries')
const platform = ffbinaries.detectPlatform()
const ffmpegBinFolder = (electron.app || electron.remote.app).getPath('userData')
let ffmpegPath, ffprobePath
const matchTypesFunctions = {
  'match-by-title': function (filename, metadataTitle, tracklistItem) {
    return (
      getEditDistance(
        metadataTitle.toUpperCase().trim(),
        tracklistItem.title.toUpperCase().trim()
      ) < 3
    )
  },
  'match-by-position': function (filename, metadataTitle, tracklistItem) {
    return filename.toUpperCase().trim() === tracklistItem.position.toUpperCase().trim()
  },
  'match-by-title2': function (filename, metadataTitle, tracklistItem) {
    return filename.toUpperCase().trim().indexOf(tracklistItem.title.toUpperCase().trim()) > -1
  }
}
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

function getEditDistance(a, b) {
  if (a.length === 0) return b.length
  if (b.length === 0) return a.length

  var matrix = []

  // increment along the first column of each row
  var i
  for (i = 0; i <= b.length; i++) {
    matrix[i] = [i]
  }

  // increment each column in the first row
  var j
  for (j = 0; j <= a.length; j++) {
    matrix[0][j] = j
  }

  // Fill in the rest of the matrix
  for (i = 1; i <= b.length; i++) {
    for (j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) == a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          Math.min(
            matrix[i][j - 1] + 1, // insertion
            matrix[i - 1][j] + 1
          )
        ) // deletion
      }
    }
  }

  return matrix[b.length][a.length]
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
        sampleRate: dataInArrFin[0],
        bitsPerSample: dataInArrFin[1],
        duration: dataInArrFin[2]
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

async function readID3Tags(file) {
  try {
    const parseFileData = await mm.parseFile(file.filepath)
    // console.log('readID3Tags ', parseFileData)

    if (parseFileData) {
      const metadata = {
        title: parseFileData.common.title,
        performers: parseFileData.common.artist,
        album: parseFileData.common.album,
        albumArtists: parseFileData.common.artists,
        year: parseFileData.common.year,
        genres: parseFileData.common.genre,
        track: parseFileData.common.track.no,
        trackCount: parseFileData.common.track.of
      }

      // console.log('metadata ', metadata)

      file.metadata = metadata
      file.sampleRate = parseFileData.format.sampleRate
      file.bitsPerSample = parseFileData.format.bitsPerSample
      file.duration = parseFileData.format.duration
      file.errors = []
    } else {
      const metadata = {
        title: '',
        performers: '',
        album: '',
        albumArtists: '',
        year: '',
        genres: '',
        track: '',
        trackCount: ''
      }

      file.metadata = metadata
      file.sampleRate = 0
      file.bitsPerSample = 0
      file.duration = 0
      file.errors = []
    }
  } catch (error) {
    const metadata = {
      title: '',
      performers: '',
      album: '',
      albumArtists: '',
      year: '',
      genres: '',
      track: '',
      trackCount: ''
    }

    file.metadata = metadata
    file.sampleRate = 0
    file.bitsPerSample = 0
    file.duration = 0
    file.errors = [error.message]
    console.error('readID3Tags error: ', error.message)
  }

  //console.log('file ', file);
  return file
}

async function clearID3Tags(filepath) {
  let errors = []
  return new Promise(function (resolve, reject) {
    console.log('clearID3Tags filepath ', filepath)
    async function start() {
      try {
        const myFile = File.createFromPath(filepath)
        myFile.tag = {}
        myFile.save()
        myFile.dispose()
        resolve('clearID3Tags done')
      } catch (err) {
        console.log(typeof err)
        console.log(err.message)
        errors.push({ message: err.message })
        resolve('clearID3Tags done')
      }
    }
    start()
  }).then((error) => {
    return { type: 'clearID3Tags', errors: errors }
  })
}

async function setID3Tags(tagsData, filepath, pathToPic) {
  let errors = []
  /// tagsData = { trackTitle, releaseAlbum, artists, albumArtists, styleAsString, year, indexTrack, trackCount, media, sleeve, formatName, formatDescription  }
  return new Promise(function (resolve, reject) {
    console.log('setID3Tags tagsData ', tagsData)
    console.log('setID3Tags filepath ', filepath)

    const { title, album, performers, albumArtists, genres, year, track, trackCount } = tagsData

    async function start() {
      try {
        const myFile = File.createFromPath(filepath)
        if (pathToPic) {
          const pic = {
            data: ByteVector.fromPath(pathToPic),
            mimeType: 'image/jpeg',
            type: PictureType.FrontCover,
            filename: 'Cover.jpg',
            description: 'Cover.jpg'
          }
          myFile.tag.pictures = [pic]
        }
        if (title) {
          myFile.tag.title = title
        }
        if (performers.length) {
          myFile.tag.performers = [performers]
        }
        if (album) {
          myFile.tag.album = album
        }
        if (albumArtists.length) {
          myFile.tag.albumArtists = [albumArtists]
        }
        if (genres) {
          myFile.tag.genres = genres
        }
        if (year) {
          myFile.tag.year = parseInt(year)
        }
        if (track) {
          myFile.tag.track = track
        }
        if (trackCount) {
          myFile.tag.trackCount = trackCount
        }

        myFile.save()
        myFile.dispose()

        resolve('addID3Tags done')
      } catch (err) {
        console.log(typeof err)
        console.log(err.message)
        errors.push({ message: err.message, trackTitle: title })
        resolve('addID3Tags done')
      }
    }
    start()
  }).then((error) => {
    return { type: 'setID3Tags', errors: errors }
  })
}

function getArtistName(artists, artist) {
  if (artists) {
    let artistsNames = []
    artists.forEach((item) => {
      let name = item.anv ? item.anv : item.name
      let nameHandled = artistNameHandler(name)
      artistsNames.push(nameHandled)
    })
    return artistsNames.join(', ')
  } else {
    return artist
  }
}

async function setMetadataRESTORED(files, releaseData, folderDir, pathToPic, needFLAC, matchType) {
  let errors = []
  let matchFunction = undefined
  console.log('files ', files)
  console.log('releaseData ', releaseData)

  return new Promise(function (resolve, reject) {
    const {
      artist,
      title,
      albumArtists,
      year,
      media,
      sleeve,
      styleAsString,
      trackCount,
      format,
      formatDescription,
      tracklist
    } = releaseData

    async function start() {
      const listOfPromises = files.map(async (file, index) => {
        const indexTrack = index + 1
        const filename = file.split('.').slice(0, -1).join('.')
        const fileExt = extname(file)
        let tagsData, newPath, oldPath, newFilename, trackTitle, trackArtist
        if (file[0] !== '.') {
          const metadata = await mm.parseFile(folderDir + file)
          const metadataTitle = metadata.common.title
          //console.log('matchType', matchType)
          let trackData = tracklist.find((tracklistItem) => {
            /// поиск по matchType
            console.log(
              'поиск по matchType ',
              filename,
              tracklistItem.position,
              filename === tracklistItem.position
            )
            if (tracklistItem.position) {
              return matchTypesFunctions[matchType](filename, metadataTitle, tracklistItem)
            }

          })
          console.log('setMetadataRESTORED trackData ', trackData)
          //// если есть совпадение
          if (trackData) {
            if (trackData.position != '') {
              //trackArtist = (trackData.artists) ? artistNameHandler(trackData.artists[0].anv) : artist
              trackArtist = getArtistName(trackData.artists, artist)
              trackTitle = trackData.title.replace(/\//g, '-')
              tagsData = {
                trackTitle: trackTitle,
                releaseAlbum: title,
                artists: trackArtist,
                albumArtists: albumArtists,
                styleAsString: styleAsString,
                year: year,
                indexTrack: indexTrack,
                trackCount: trackCount,
                media: media,
                sleeve: sleeve,
                formatName: format,
                formatDescription: formatDescription
              }
              oldPath = folderDir + file
              newFilename = trackData.position.trim() + '. ' + trackTitle + fileExt
              newPath = folderDir + newFilename
              if (oldPath !== newPath) {
                try {
                  fs.renameSync(oldPath, newPath)
                } catch (err) {
                  console.log(err)
                }
              }
            }
          } else {
            tagsData = {
              trackTitle: '',
              releaseAlbum: title,
              artists: [artist],
              albumArtists: albumArtists,
              styleAsString: styleAsString,
              year: year,
              indexTrack: indexTrack,
              trackCount: trackCount,
              media: media,
              sleeve: sleeve,
              formatName: format,
              formatDescription: formatDescription
            }
            newPath = folderDir + file
            errors.push({ message: 'Трек не найден (RESTORED)' })
          }
          return addID3TagsOnly(newPath, pathToPic, tagsData, newFilename, folderDir, needFLAC)
        }
      })
      const result = await Promise.all(listOfPromises)
      result.forEach((item) => {
        if (item.errors.length) {
          errors.push(item.errors)
        }
      })
      console.log('setMetadataRESTORED result ', JSON.stringify(result))
      resolve({ type: 'setMetadataRESTORED', success: true, errors: errors })
    }
    start()
  })
}

async function addID3TagsOnly(path, pathToPic, tagsData, filename, dir, needFLAC) {
  let errors = []
  /// tagsData = { trackTitle, releaseAlbum, artists, albumArtists, styleAsString, year, indexTrack, trackCount, media, sleeve, formatName, formatDescription  }
  return new Promise(function (resolve, reject) {
    // console.log('addID3TagsOnly ', path, pathToPic, tagsData, filename, dir, needFLAC)
    console.log('addID3TagsOnly tagsData ', tagsData)
    const {
      trackTitle,
      releaseAlbum,
      artists,
      albumArtists,
      styleAsString,
      year,
      indexTrack,
      trackCount
    } = tagsData

    // console.log('addID3Tags indexTrack ', indexTrack, trackCount)

    async function addID3Tags() {
      try {
        const myFile = File.createFromPath(path)

        /// clear all values
        myFile.tag.clear()

        /// set new values
        if (pathToPic) {
          const pic = {
            data: ByteVector.fromPath(pathToPic),
            mimeType: 'image/jpeg',
            type: PictureType.FrontCover,
            filename: 'Cover.jpg',
            description: 'Cover.jpg'
          }
          myFile.tag.pictures = [pic]
        }

        myFile.tag.title = trackTitle
        myFile.tag.album = releaseAlbum
        myFile.tag.performers = [artists]
        myFile.tag.albumArtists = [albumArtists]
        myFile.tag.genres = styleAsString
        if (year) {
          myFile.tag.year = year
        }
        myFile.tag.comment = ''
        myFile.tag.description = ''
        myFile.tag.track = indexTrack
        myFile.tag.trackCount = trackCount

        myFile.save()
        myFile.dispose()

        //// If Need - Convert to Flac
        if (filename && needFLAC) {
          await convertToFlac(path, filename, dir)
        }

        resolve('addID3Tags done')
      } catch (err) {
        console.log('addID3TagsOnly error ', err.message)
        errors.push({ message: err.message, indexTrack: indexTrack, trackTitle: trackTitle })
        resolve('addID3Tags done')
      }
    }
    addID3Tags()
  }).then((error) => {
    return { type: 'addID3TagsOnly', errors: errors }
  })
}

function ffmpegImageConvert(path, path2) {
  return new Promise((resolve, reject) => {
    const magick = child_process.spawn(ffmpegPath, ['-i', path, path2])

    magick.on('error', function (err) {
      console.log('magickConvert error: ' + err)
      reject()
    })
    magick.on('exit', (statusCode) => {
      if (statusCode === 0) {
        console.log('magickConvert done')
        resolve(true)
      }
    })
  })
}

async function convertToFlac(filePath, filaname, dir) {
  return new Promise(function (resolve, reject) {
    let extension = extname(filaname)
    let name = basename(filaname, extension)
    console.log('ffmpegPath ', ffmpegPath)
    let convert = child_process.spawn(ffmpegPath, [
      '-i',
      filePath,
      `-c:a`,
      `flac`,
      `-compression_level`,
      `0`,
      `-sample_fmt`,
      `s16`,
      `-ar`,
      `44100`,
      dir + '/' + name + '.flac'
    ])
    convert
      .on('data', (err) => {
        console.log('convertToFlac data: ', new String(err))
      })
      .on('exit', (statusCode) => {
        console.log('convertToFlac exit: ' + statusCode)
        if (statusCode === 0) {
          try {
            fs.unlinkSync(filePath)
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

async function changeFlac(filePath, filaname, dir) {
  return new Promise(function (resolve, reject) {
    let extension = extname(filaname)
    let name = basename(filaname, extension)
    let nameTemp = `${name}-temp`
    let convert = child_process.spawn(ffmpegPath, [
      '-i',
      filePath,
      `-sample_fmt`,
      `s16`,
      `-ar`,
      `44100`,
      dir + '/' + nameTemp + '.flac'
    ])

    convert
      .on('data', (err) => {
        //console.log("err:", new String(err));
      })

      .on('exit', (statusCode) => {
        //console.log('statusCode: '+statusCode);
        if (statusCode === 0) {
          try {
            fs.unlinkSync(filePath)
            fs.renameSync(`${dir}/${nameTemp}.flac`, `${dir}/${name}.flac`)
          } catch (error) {
            console.log(error)
          }
          resolve('convertToFlac done')
        }
      })
      .on('error', function (err) {
        console.log('changeFlac: ' + err)
      })
  }).then((result) => {
    return result
  })
}

module.exports = {
  clearID3Tags,
  setMetadataRESTORED,
  readID3Tags,
  setID3Tags,
  convertToFlac,
  changeFlac,
  ffmpegImageConvert
}
