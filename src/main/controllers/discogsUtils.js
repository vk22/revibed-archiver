const fs = require('fs')
const https = require('https')
const Discogs = require('disconnect').Client
const db = new Discogs({
  consumerKey: 'EZWmCxdwZuUQCTmUbfRY',
  consumerSecret: 'tyoPkXCrZTCqIlFDaVIWeZkwTeMaCbSm'
}).database()

const { artistNameHandler } = require('./utils')
const { setTimeout } = require('core-js')

async function getArtistData(artists) {
  return new Promise((resolve, reject) => {
    const artist_data = []
    async function start() {
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
          resolve(undefined)
        }
      }
    }
    start()
    resolve(artist_data)
  })
}

/////
function handleTracklist(tracklist) {
  let final = tracklist.reduce((acc, curr) => {
    if (curr.sub_tracks) {
      curr.sub_tracks.forEach((el) => {
        el.title = `${curr.title} ${el.title}`
        acc.push(el)
      })
    } else {
      acc.push(curr)
    }
    return acc
  }, [])
  return final
}

async function getReleaseData(releaseID, discogsMergeSubtracks) {
  try {
    const discogsReleaseData = await db.getRelease(releaseID)
    console.log('discogsReleaseData ', discogsReleaseData)
    //const discogsImages = discogsReleaseData.images

    ///
    //await downloadImages(discogsImages, rootFolder)

    if (
      discogsReleaseData.artists[0].name !== 'Various' &&
      discogsReleaseData.artists[0].name !== 'Various Artists'
    ) {
      discogsReleaseData.artist_data = await getArtistData(discogsReleaseData.artists)
    }
    // discogsReleaseData.tracklist = discogsReleaseData.tracklist.filter((tracklistItem) => {
    //   return tracklistItem.position !== "";
    // });
    if (!discogsMergeSubtracks) {
      discogsReleaseData.tracklist = handleTracklist(discogsReleaseData.tracklist)
    } else {
      discogsReleaseData.tracklist = discogsReleaseData.tracklist.map((tracklistItem) => {
        if (tracklistItem.position === '' && tracklistItem.sub_tracks) {
          tracklistItem.position = tracklistItem.sub_tracks[0].position
        }
        return tracklistItem
      })
    }

    return discogsReleaseData
  } catch (err) {
    console.log('error getReleaseData', err)
    return false
  }
}

const getReleaseTracklistByID = async (data) => {
  const releaseID = data.releaseID

  try {
    const result = await getReleaseData(releaseID)
    const artist = artistNameHandler(result.artists[0].name)
    const title = result.title
    const tracklist = result.tracklist
    const format = result.formats != undefined ? result.formats[0].name : ''

    console.log('getReleaseTracklist tracklist', tracklist)
    console.log('getReleaseTracklist format', format)

    return tracklist
  } catch (error) {
    console.log(error)
    return false
  }
}

function changeCoverName(name) {
  console.log('changeCoverName ', name)
  let arr = name.split('.')
  let filename = `${arr[0]}-${Math.floor(Math.random() * 10000)}`
  return `${filename}.${arr[1]}`
}

async function downloadImages(array, rootFolder) {
  let finalImages = []
  for (const item of array) {
    const imageURL = item.uri
    let imageTitle = imageURL.split('/').slice(-1)[0]
    console.log('imageTitle ', imageTitle)
    if (fs.existsSync(rootFolder + '/' + imageTitle)) {
      imageTitle = changeCoverName(imageTitle)
    }
    const imageBinary = await db.getImage(imageURL)
    await downloadImage(imageBinary, imageTitle, rootFolder)
    finalImages.push(imageTitle)
  }
  return finalImages
}

function downloadImage(data, filename, rootFolder) {
  return new Promise((resolve, reject) => {
    fs.writeFile(`${rootFolder}${filename}`, data, 'binary', (err) => {
      if (err) throw err
      console.log('Image downloaded successfully!')
      resolve('Image downloaded successfully!')
    })
  })
}

module.exports = {
  getReleaseData,
  getReleaseTracklistByID,
  downloadImages
}
