const fs = require('fs-extra')
const sharp = require('sharp')
const { readdirSync, renameSync } = require('fs')
const { join, extname, basename } = require('path')
const child_process = require('child_process')
const { ByteVector, File, PictureType, Picture } = require('node-taglib-sharp')
const allowedAudioFormats = ['.aiff', '.aif', '.flac', '.wav']
const allowedVisualFormats = ['.jpg', '.jpeg', '.JPG', '.JPEG', '.png', '.PNG', '.webp']
const mm = require('music-metadata')
// import getArtistName from './utils.js'
const IMG_QUALITY = 50
const RESIZE_WIDTH = 2000 //px
const restoredFileRate = '16/44100'

//// ffmpeg
import initFFmpeg from './ffmpegService.js'
let ffmpegPath
initFFmpeg().then((data) => {
  ffmpegPath = data
})
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

//// Services
import ErrorsService from './errorsService.js'
import ProjectService from './projectService.js'

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

const createDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir)
  }
  return true
}

function moveFile(filePath, destinationPath) {
  renameSync(filePath, destinationPath)
}

class FilesService {
  constructor() {
    this.rootFolder = null
    this.needCheckFiles = null
    this.needFLAC = null
    this.allFilesList = []
    this.restoredFilesList = []
    this.filesRESTORED = []
    this.mainImage = null
    this.storageFolder = null
  }
  setInitialData(rootFolder, storageFolder) {
    this.rootFolder = rootFolder
    this.storageFolder = storageFolder
    const filesInFolder = fs.readdirSync(this.rootFolder)
    this.filesRESTORED = filesInFolder.filter((file) => {
      const fileExt = extname(file)
      if (allowedAudioFormats.indexOf(fileExt) > -1) {
        return file
      }
    })
  }
  async parseFiles(dir, needConvertCovers) {
    console.log('parseFiles ')
    const visual = []
    const files = []
    const errors = []
    const list = fs.readdirSync(dir)
    console.log('list ', list)
    for (const file of list) {
      let fileErrors = []
      const fullPath = `${dir}/${file}`
      const fileExt = extname(file)
      /// audio files
      if (file[0] !== '.' && allowedAudioFormats.indexOf(fileExt) > -1) {
        const fileStart = {
          filename: file,
          filepath: fullPath,
          errors: fileErrors
        }
        console.log('fileStart ', fileStart)
        const fileFinal = await this.readID3Tags(fileStart)
        console.log('fileFinal ', fileFinal)
        files.push(fileFinal)

        /// visual files
      } else if (file[0] !== '.' && allowedVisualFormats.indexOf(fileExt) > -1) {
        if (needConvertCovers) {
          const file2 = this.changeCoverName(file)
          const fullPath2 = `${dir}/${file2}`
          const magickConvertRes = await this.ffmpegImageConvert(fullPath, fullPath2)
          console.log('magickConvertRes ', magickConvertRes)
          if (magickConvertRes && fs.existsSync(fullPath)) {
            await fs.unlinkSync(fullPath)
            const imageSize = await this.getImageSize(fullPath2)
            console.log('imageSize ', imageSize)
            if (!imageSize) {
              fileErrors.push('getImageSize')
            }
            visual.push({
              filename: file2,
              filepath: fullPath2,
              imageSize: imageSize,
              errors: fileErrors
            })
          }
        } else {
          const imageSize = await this.getImageSize(fullPath)
          console.log('imageSize ', imageSize)

          visual.push({
            filename: file,
            filepath: fullPath,
            imageSize: imageSize,
            errors: fileErrors
          })
        }
      } else {
        console.log(`${file} has forbbiden file extantion`)
        ErrorsService.add(`${file} has forbbiden file extantion`)
      }
    }
    console.log('files ', files)
    return { files, visual, errors }
  }
  async getFilesFromFolder() {
    return await this.parseFiles(this.rootFolder, false)
  }
  async readID3Tags(file) {
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
  changeCoverName(name) {
    let arr = name.split('.')
    let filename = `${arr[0]}-${Math.floor(Math.random() * 10000)}`
    return `${filename}.${arr[1]}`
  }
  ffmpegImageConvert(path, path2) {
    return new Promise((resolve, reject) => {
      const magick = child_process.spawn(ffmpegPath, ['-i', path, '-q:v', '1', path2])

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
  getImageSize(path) {
    return new Promise((resolve, reject) => {
      sharp(path)
        .metadata()
        .then((metadata) => {
          const width = metadata.width
          const height = metadata.height
          //console.log(`Image dimensions from sharp: ${width}x${height}`);
          resolve(`${width}x${height}`)
        })
        .catch((err) => {
          resolve(err)
          console.error('getImageSize err', err, path)
        })
    })
  }
  downloadBinaryImage(data, filename) {
    if (fs.existsSync(this.rootFolder + '/' + filename)) {
      filename = this.changeCoverName(filename)
    }
    return new Promise((resolve, reject) => {
      fs.writeFile(`${this.rootFolder}${filename}`, data, 'binary', (err) => {
        if (err) throw err
        console.log('Image downloaded successfully!')
        resolve(true)
      })
    })
  }
  setMainImage(mainImage) {
    this.mainImage = mainImage
  }
  async setMetadata(matchType) {
    /// get releaseData from ProjectService
    const releaseData = ProjectService.releaseData
    const pathToPic = await this.createCoverPic()
    console.log('releaseData ProjectService ', releaseData)
    const prepareMetadataList = await this.prepareMetadata(
      this.filesRESTORED,
      releaseData,
      this.rootFolder,
      pathToPic,
      this.needFLAC,
      matchType
    )
    console.log('prepareMetadataList ', prepareMetadataList)

    for (let fileMetaData of prepareMetadataList) {
      await this.addID3TagsOnly(fileMetaData)
    }
    // if (startMetaData.errors.length) {
    //   startMetaData.errors.forEach((item) => {
    //     this.errors.push(item)
    //   })
    // }
    fs.unlinkSync(pathToPic)
    return this
  }
  createCoverPic() {
    const mainImage = this.mainImage
    const coverFilePath = `${this.rootFolder}/picforfiles.jpg`
    const imageSize = mainImage.imageSize ? +mainImage.imageSize.split('x')[0] : 0
    return new Promise(function (resolve, reject) {
      if (imageSize > 600) {
        try {
          ;(async () => {
            await sharp(mainImage.filepath)
              .resize(600, 600)
              .jpeg({
                quality: 50
              })
              .toFile(coverFilePath)
              .then((info) => {
                console.log(info)
                resolve(coverFilePath)
              })
              .catch((err) => {
                console.log(err)
                reject()
              })
          })()
        } catch (err) {
          console.log(err)
        }
      } else {
        try {
          ;(async () => {
            await sharp(mainImage.filepath)
              .jpeg({
                quality: IMG_QUALITY
              })
              .toFile(coverFilePath)
              .then((info) => {
                console.log(info)
                resolve(coverFilePath)
              })
              .catch((err) => {
                console.log(err)
                reject()
              })
          })()
        } catch (err) {
          console.log(err)
        }
      }
    })
  }
  async prepareMetadata(files, releaseData, folderDir, pathToPic, needFLAC, matchType) {
    let errors = []
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

      ;(async () => {
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
            console.log('prepareMetadata trackData ', trackData)
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
            //return this.addID3TagsOnly(newPath, pathToPic, tagsData, newFilename, folderDir, needFLAC)
            return { newPath, pathToPic, tagsData, newFilename, folderDir, needFLAC }
          }
        })
        console.log('listOfPromises ', listOfPromises)
        const result = await Promise.all(listOfPromises)
        console.log('prepareMetadata result ', JSON.stringify(result))
        resolve(result)
      })()

      // result.forEach((item) => {
      //   if (item.errors.length) {
      //     errors.push(item.errors)
      //   }
      // })
    })
  }
  async addID3TagsOnly({ newPath, pathToPic, tagsData, newFilename, folderDir, needFLAC }) {
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
          const myFile = File.createFromPath(newPath)
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
          if (newFilename && needFLAC) {
            await this.convertToFlac(newPath, newFilename, folderDir)
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
  async convertToFlac(filePath, filaname, dir) {
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
  async changeFlac(filePath, filaname, dir) {
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
  async convertImage(oldFilename, newFilename, imageSize) {
    const oldPath = this.rootFolder + oldFilename
    const newPath = this.rootFolder + newFilename + '.jpg'
    try {
      if (imageSize > 2000) {
        await sharp(oldPath, { failOnError: false })
          .resize({
            fit: sharp.fit.contain,
            width: RESIZE_WIDTH
          })
          .jpeg({
            quality: 100
          })
          .toFile(newPath)
          .then((data) => {
            console.log('data ', data)
          })
          .catch((err) => {
            console.log('err ', err)
          })
      } else {
        await sharp(oldPath, { failOnError: false })
          .jpeg({
            quality: 100
          })
          .toFile(newPath)
          .then((data) => {
            console.log('data ', data)
          })
          .catch((err) => {
            console.log('err ', err)
          })
      }
      await fs.unlinkSync(oldPath)
      return {
        success: true
      }
    } catch (err) {
      console.log('convertImage err ', err)
      return {
        success: false,
        message: err.message
      }
    }
  }
  async deleteFile(filename) {
    try {
      const path = this.rootFolder + filename
      if (fs.existsSync(path)) {
        await fs.unlinkSync(path)
      }
      return {
        success: true
      }
    } catch (err) {
      return {
        success: false,
        message: err.message
      }
    }
  }
  async createFolders(releaseID) {
    console.log('createFolders ', releaseID)

    const folderMAIN = `${this.rootFolder}/${releaseID}`
    const folderRESTORED = `${folderMAIN}/RESTORED/`
    const folderVISUAL = `${folderMAIN}/VISUAL/`
    const allFilesList = []

    console.log('folderMAIN ', folderMAIN)

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
    for (const file of readdirSync(this.rootFolder)) {
      let ifFile = fs.lstatSync(this.rootFolder + file).isFile()
      const fileExt = extname(file)
      const name = basename(file, fileExt)
      if (ifFile && file[0] !== '.' && allowedAudioFormats.indexOf(fileExt) > -1) {
        allFilesList.push(file)
        renameSync(join(this.rootFolder, file), join(folderRESTORED, name + fileExt))
      }
      if (
        (ifFile && file[0] !== '.' && fileExt === '.jpg') ||
        fileExt === '.jpeg' ||
        fileExt === '.png'
      ) {
        renameSync(join(this.rootFolder, file), join(folderVISUAL, name + fileExt))
      }
    }
    console.log('filesHandler Done')
    return { folderMAIN, allFilesList }
  }
  async archiveProject() {
    /// get releaseID from ProjectService
    const releaseID = ProjectService.releaseID
    console.log('archiveProject releaseID ', releaseID)
    try {
      if (!fs.existsSync(this.rootFolder)) {
        fs.mkdirSync(this.rootFolder)
      }
    } catch (error) {
      return {
        success: false,
        message: error.message
      }
    }

    ////
    try {
      let { folderMAIN, allFilesList } = await this.createFolders(releaseID)
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
          await this.convertToFlac(filePath, file, this.folderRESTORED)
        } else {
          await this.changeFlac(filePath, file, this.folderRESTORED)
        }
      }
      return {
        success: true,
        message: 'Release final files has been done!',
        storageFolder: this.storageFolder,
        folderMAIN: this.folderMAIN
      }
    } catch (error) {
      return {
        success: false,
        message: error.message
      }
    }
  }
  async getSpectros() {
    const restoredData = {
      folder: this.rootFolder,
      audioFiles: this.filesRESTORED,
      rate: restoredFileRate,
      isRaw: false
    }
    // this.folderSPECTRO = this.rootFolder + "/SPECTRO/"
    console.log('restoredData ', restoredData)
    console.log('this.folderSPECTRO ', this.folderSPECTRO)
    const result = await this.getFilesSpectros(restoredData, this.rootFolder)
    this.restoredFilesList = result.restoredFilesList
    return {
      success: true,
      message: 'Spectro done!'
    }
  }
  async getFilesSpectros(restoredData, folderSPECTRO) {
    let restoredFilesList = restoredData.audioFiles.map((el) => {
      return { file: el }
    })
    const listOfPromises = restoredData.audioFiles.map((audioFile) => {
      return this.createSpectro(restoredData.folder + '/' + audioFile, audioFile, folderSPECTRO)
    })

    let spectros = await Promise.all(listOfPromises)
    spectros.forEach((name, index) => {
      restoredFilesList[index].filename = name
      restoredFilesList[index].spectro = folderSPECTRO + name + '-spectro.png'
    })

    console.log('getFilesSpectros FINAl')

    return { restoredFilesList }
  }
  async createSpectro(filePath, filaname, rootFolder) {
    console.log('createSpectro ', filePath, filaname, rootFolder)
    let allSpectroList = []
    return new Promise(function (resolve, reject) {
      let extension = extname(filaname)
      let name = basename(filaname, extension)
      let spectrogram = child_process.spawn(ffmpegPath, [
        '-i',
        filePath,
        `-lavfi`,
        `showspectrumpic=s=2560x640:mode=separate`,
        rootFolder + '/' + name + '-spectro.png'
      ])
      //let spectrogram = child_process.spawn('sox', [filePath, `-n spectrogram -o`, rootFolder + '/' + name + '-spectro.png']);
      spectrogram
        .on('data', (err) => {
          console.log('err:', new String(err))
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

  ///
  async getFileLog(filepath, index) {
    const logfile = `logfile.log`
    const logfilePath = `${this.rootFolder}/logfile-${index}.log`
    const filepathHandled = `"${filepath}"`
    console.log('logfilePath ', logfilePath)
    return new Promise(function (resolve, reject) {
      let aphasemeter = child_process.spawn(ffmpegPath, [
        `-i ${filepathHandled} -af "aphasemeter=video=0:phasing=1:angle=90:duration=1:tolerance=0.001,ametadata=print:file=${logfilePath}" -vn -f null -`
      ])
      // console.log('aphasemeter ', aphasemeter)

      aphasemeter
        .on('data', (err) => {
          console.log('data:', new String(err))
        })
        .on('error', (err) => {
          console.log('error:', new String(err))
        })
        .on('exit', (statusCode) => {
          console.log('exit:', statusCode)
          if (statusCode === 0) {
            //console.log("createSpectro done");
            resolve(logfilePath)
          }
        })
    }).then((result) => {
      return result
    })
  }
  async parseFileLog(logFile) {
    const goodArr = []
    const badArr = []
    let isMono = false
    try {
      const dataArray = fs.readFileSync(logFile, 'utf8').toString().split('\n')
      //console.log(dataArray);
      for (let i in dataArray) {
        // console.log('dataArray[1] ', dataArray[i]);
        if (dataArray[i].includes('phase=')) {
          let phase = +dataArray[i].split('=')[1]
          // console.log('phase ', phase)
          if (phase === 1) {
            badArr.push(phase)
          } else {
            goodArr.push(phase)
          }
        }
      }
      console.log('badArr.length ', badArr.length)
      console.log('goodArr.length ', goodArr.length)

      if (badArr.length > goodArr.length) {
        isMono = true
      }
      return isMono
    } catch (err) {
      console.error(err)
      return false
    }
  }

  async checkIfFilesAreMono() {
    let index = 1
    for (let filename of this.filesRESTORED) {
      console.log('filename ', filename)
      console.log('this.rootFolder ', this.rootFolder)
      const filepath = `${this.rootFolder}/${filename}`
      const logFile = await this.getFileLog(filepath, index)
      const result = await this.parseFileLog(logFile)
      console.log('result ', result)
      index += 1
    }

    return {
      success: true,
      message: 'checkIfFilesAreMono done!'
    }
  }

  async moveFolder(dir, destination) {
    console.log('dir ', dir)
    console.log('destination ', destination)
    const dirName = dir.replace(/\/$/, '').split('/').pop()
    console.log('dirName ', dirName)
    const mainDestPath = join(destination, dirName)
    console.log('mainDestPath ', mainDestPath)
    ///
    createDir(mainDestPath)

    for (const file of readdirSync(dir)) {
      console.log('file ', file)
      const filePath = join(dir, file)
      const ifFile = fs.lstatSync(filePath).isFile()
      const isDirectory = fs.lstatSync(filePath).isDirectory()
      if (isDirectory) {
        this.moveFolder(filePath, mainDestPath)
      } else {
        const filePathDest = join(mainDestPath, file)
        console.log('filePathDest ', filePathDest)
        moveFile(filePath, filePathDest)
      }
    }

    return {
      success: true,
      message: 'Release Folder has been moved'
    }
  }
}

export default new FilesService()
