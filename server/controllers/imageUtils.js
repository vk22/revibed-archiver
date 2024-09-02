const fs = require('fs-extra')
const sharp = require('sharp')
const IMG_QUALITY = 80
const RESIZE_WIDTH = 1600
const child_process = require('child_process')

async function convertImage(oldPath, newPath, imageSize) {
  console.log('convertImage ', oldPath, newPath, imageSize)
  try {
    if (imageSize > 1599) {
      await sharp(oldPath, { failOnError: false })
        .resize({
          fit: sharp.fit.contain,
          width: RESIZE_WIDTH
        })
        .toFile(newPath)
        .then( data => { console.log('data ', data) })
        .catch( err => { console.log('err ', err) });
    } else {
      await sharp(oldPath, { failOnError: false })
        .toFile(newPath)
        .then( data => { console.log('data ', data) })
        .catch( err => { console.log('err ', err) });
    }

    await fs.unlinkSync(oldPath)
    return true
  } catch (err) {
    console.log('convertImage err ', err)
    return true
  }
}

function magickConvert(path, path2) {
  return new Promise((resolve, reject) => {
    const magick = child_process.spawn('magick', [path, path2])

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

function getImageSize(path) {
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

function createCoverPic(mainImage, coverFilePath) {
  const imageSize = mainImage.imageSize ? +mainImage.imageSize.split('x')[0] : 0
  return new Promise(function (resolve, reject) {
    if (imageSize > 600) {
      try {
        ;(async () => {
          await sharp(mainImage.filepath)
            .resize(600, 600)
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

module.exports = {
  createCoverPic,
  getImageSize,
  magickConvert,
  convertImage
}
