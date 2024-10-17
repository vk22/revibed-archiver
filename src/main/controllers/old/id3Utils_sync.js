const fs = require('fs')
const { join, extname, basename } = require('path')
const { ByteVector, File, PictureType, Picture } = require('node-taglib-sharp')
const child_process = require('child_process')
// const ffmpegPath = '/usr/local/bin/ffmpeg'
const {
  prepareReleaseData,
  removeRawFromName,
  checkFileInTracklist,
  base64_encode,
  artistNameHandler
} = require('./utils')

//const log = require('electron-log')
const electron = require('electron')
const ffbinaries = require('ffbinaries')
const platform = ffbinaries.detectPlatform()
const ffmpegBinFolder = (electron.app || electron.remote.app).getPath('userData')
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

async function setMetadataRESTORED(files, releaseDataFinal, GLOBAL) {
  //// pathToPic
  let pathToPic = GLOBAL.folderVISUAL + '/Front.jpg'
  if (!fs.existsSync(pathToPic)) {
    pathToPic = GLOBAL.folderVISUAL + '/A.jpg'
  }

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
    let index = 0
    for (const file of files) {
      const indexTrack = index + 1
      const filename = file.split('.').slice(0, -1).join('.')
      const fileExt = extname(file)
      if (file !== '.DS_Store') {
        const trackData = tracklist.find((tracklistItem) => {
          return filename.toUpperCase().trim() === tracklistItem.position.toUpperCase().trim()
        })

        //// если есть совпадение
        // console.log('setMetadataRESTORED есть совпадение? ', trackData)
        if (trackData) {
          if (trackData.position != '') {
            const trackArtist = trackData.artists
              ? artistNameHandler(trackData.artists[0].name)
              : artist
            if (trackData.extraartists != undefined) {
              //console.log(trackData.extraartists[0].role + " by " + trackData.extraartists[0].name);
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
            const oldPath = GLOBAL.folderRESTORED + file
            const newFilename = trackData.position.trim() + '. ' + trackTitle + fileExt
            const newPath = GLOBAL.folderRESTORED + newFilename

            try {
              fs.renameSync(oldPath, newPath)
              //console.log("setMetadataRESTORED Successfully renamed the directory.")
            } catch (err) {
              console.log(err)
            }
            await addID3Tags(newPath, pathToPic, tagsData)
            await convertToFlac(newPath, newFilename, GLOBAL.folderRESTORED)
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

async function setMetadataRAW(files, releaseDataFinal, GLOBAL) {
  const { tracklist } = releaseDataFinal
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
      //console.log('setMetadataRAW есть совпадение? ', trackData)
      if (trackData) {
        const trackTitle = trackData.title.replace(/\//g, '-')
        if (trackData.position != '') {
          const oldPath = GLOBAL.folderRAW + file
          const newFilename = trackData.position.trim() + '. ' + trackTitle + ' RAW' + fileExt
          const newPath = GLOBAL.folderRAW + newFilename
          try {
            fs.renameSync(oldPath, newPath)
            //console.log("newRipRootFolderRAW Successfully renamed the directory.")
          } catch (err) {
            console.log(err)
          }
          await convertToFlac(newPath, newFilename, GLOBAL.folderRAW)
        }
      }
    }
  }
}

async function setMetadataAUDIO(files, releaseDataFinal, pathToPic, GLOBAL) {
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
    //console.log('readdirSync files ', files)
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
              //console.log(trackData.extraartists[0].role + " by " + trackData.extraartists[0].name);
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

            const oldPath = GLOBAL.folderAUDIO + file
            const newFilename = trackData.position.trim() + '. ' + trackTitle + fileExt
            const newPath = GLOBAL.folderAUDIO + newFilename

            try {
              fs.renameSync(oldPath, newPath)
            } catch (err) {
              console.log(err)
            }
            await addID3Tags(newPath, pathToPic, tagsData)
            await convertToFlac(newPath, filename, GLOBAL.folderAUDIO)
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

          const newPath = GLOBAL.folderAUDIO + file
          await addID3Tags(newPath, pathToPic, tagsData)
          await convertToFlac(newPath, filename, GLOBAL.folderAUDIO)
        }
      }
    }
  } catch (error) {
    console.log('RESTORED rename error: ', error)
  }
}

function addID3Tags(path, pathToPic, tagsData) {
  /// tagsData = { trackTitle, releaseAlbum, artists, albumArtists, styleAsString, year, indexTrack, trackCount, media, sleeve, formatName, formatDescription  }
  return new Promise(function (resolve, reject) {
    // console.log('addID3Tags path ', path)
    // console.log('addID3Tags pathToPic ', pathToPic)
    // console.log('addID3Tags tagsData ', tagsData)
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

async function convertToFlac(filePath, filaname, dir) {
  //console.log('convertToFlac ', filePath, filaname, dir)
  return new Promise(function (resolve, reject) {
    let extension = extname(filaname)
    let name = basename(filaname, extension)
    //ffmpeg -i A.aif -c:a flac audio.flac
    let convert = child_process.spawn(ffmpegPath, [
      '-i',
      filePath,
      `-c:a`,
      `flac`,
      dir + '/' + name + '.flac'
    ])
    //let spectrogram = child_process.spawn('sox', [filePath, `-n spectrogram -o`, GLOBAL.rootFolder + '/' + name + '-spectro.png']);

    convert
      .on('data', (err) => {
        //console.log("err:", new String(err));
      })
      .on('exit', (statusCode) => {
        //console.log('statusCode: '+statusCode);
        if (statusCode === 0) {
          //console.log("convertToFlac done");
          /// remove aiff

          try {
            fs.unlinkSync(filePath)
            //console.log("remove aiff successfully.");
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

module.exports = {
  setMetadataRESTORED,
  setMetadataRAW,
  setMetadataAUDIO
}
