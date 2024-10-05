const path = require('path')
const log = require('electron-log')
const electron = require('electron')
const ffbinaries = require('ffbinaries')
const { default: XingHeader } = require('node-taglib-sharp/dist/mpeg/xingHeader')
const platform = ffbinaries.detectPlatform()
const ffmpegBinFolder = (electron.app || electron.remote.app).getPath('userData')

const ffmpegPath = function () {
  return new Promise((resolve, reject) => {
    ffbinaries.downloadFiles(
      ['ffmpeg', 'ffprobe'],
      { platform: platform, quiet: true, destination: ffmpegBinFolder },
      (err, data) => {
        if (err) {
          return reject(err)
        }
        try {
          let ffmpegPath = path.join(ffmpegBinFolder, ffbinaries.getBinaryFilename('ffmpeg', platform))
          console.log('ffmpegPath ', ffmpegPath)
          // let ffprobePath = path.join(
          //   ffmpegBinFolder,
          //   ffbinaries.getBinaryFilename('ffprobe', platform)
          // )
          resolve(ffmpegPath)
        } catch (err) {
          reject(err)
          log.warn('reject ' + err)
        }
      }
    )
  })
}


module.exports = ffmpegPath