const Discogs = require('disconnect').Client
const db = new Discogs({
  consumerKey: 'EZWmCxdwZuUQCTmUbfRY',
  consumerSecret: 'tyoPkXCrZTCqIlFDaVIWeZkwTeMaCbSm'
}).database()
const FilesService = require('../services/filesService')
const ProjectService = require('../services/projectService')

class DiscogsService {
  ///
  constructor() {
    this.releaseID = undefined
    this.releaseData = []
    this.discogsTracklist = []
  }
  getData() {
    return this
  }
  async getRelease(releaseID, discogsMergeSubtracks) {
    this.releaseID = releaseID
    const discogsReleaseData = await this.getReleaseData(releaseID, discogsMergeSubtracks)
    // console.log('discogsReleaseData', discogsReleaseData)
    if (discogsReleaseData) {
      this.releaseData = this.prepareReleaseData(discogsReleaseData)
      ProjectService.setReleaseData(this.releaseData)
      this.discogsTracklist = discogsReleaseData.tracklist
    }
    console.log('getRelease ', this)
    return this
  }
  async getArtistData(artists) {
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
  handleTracklist(tracklist) {
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

  async getReleaseData(releaseID, discogsMergeSubtracks) {
    try {
      const discogsReleaseData = await db.getRelease(releaseID)
      // console.log('discogsReleaseData ', discogsReleaseData)
      if (
        discogsReleaseData.artists[0].name !== 'Various' &&
        discogsReleaseData.artists[0].name !== 'Various Artists'
      ) {
        discogsReleaseData.artist_data = await this.getArtistData(discogsReleaseData.artists)
      }
      if (!discogsMergeSubtracks) {
        discogsReleaseData.tracklist = this.handleTracklist(discogsReleaseData.tracklist)
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

  async getReleaseTracklistByID(data) {
    const releaseID = data.releaseID

    try {
      const result = await this.getReleaseData(releaseID)
      const artist = this.artistNameHandler(result.artists[0].name)
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

  changeCoverName(name) {
    let arr = name.split('.')
    let filename = `${arr[0]}-${Math.floor(Math.random() * 10000)}`
    return `${filename}.${arr[1]}`
  }
  async downloadDiscogsImages() {
    console.log('downloadDiscogsImages ', this)
    console.log('FilesService.rootFolder ', FilesService.rootFolder)
    if (this.releaseData.images.length) {
      this.discogsImages = await this.downloadImages(
        this.releaseData.images,
        FilesService.rootFolder
      )
    }
    return this
  }
  async downloadImages(array, rootFolder) {
    let finalImages = []
    for (const item of array) {
      const imageURL = item.uri
      const filename = imageURL.split('/').slice(-1)[0]
      const imageBinary = await db.getImage(imageURL)
      await FilesService.downloadBinaryImage(imageBinary, filename)
      finalImages.push(filename)
    }
    return finalImages
  }

  // downloadImage(data, filename, rootFolder) {
  //   return new Promise((resolve, reject) => {
  //     fs.writeFile(`${rootFolder}${filename}`, data, 'binary', (err) => {
  //       if (err) throw err
  //       console.log('Image downloaded successfully!')
  //       resolve('Image downloaded successfully!')
  //     })
  //   })
  // }
  artistNameHandler(str) {
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
  prepareReleaseData(discogsReleaseData) {
    console.log('prepareReleaseData ')
    /// Format name
    const formatName =
      discogsReleaseData.formats !== undefined ? discogsReleaseData.formats[0].name : ''
    const formatDescription =
      discogsReleaseData.formats !== undefined &&
        discogsReleaseData.formats[0].descriptions != undefined
        ? discogsReleaseData.formats[0].descriptions[0]
        : ''

    /// Label
    const label = discogsReleaseData.labels !== undefined ? discogsReleaseData.labels[0].name : ''
    const labelID = discogsReleaseData.labels !== undefined ? discogsReleaseData.labels[0].id : ''

    //// Release Artist
    const artistData =
      discogsReleaseData.artists[0].anv !== ''
        ? discogsReleaseData.artists[0].anv
        : discogsReleaseData.artists[0].name
    const releaseArtists = this.artistNameHandler(artistData)
    const releaseAlbum = discogsReleaseData.title

    //// Album Artist
    const albumArtists =
      discogsReleaseData.artists_sort !== undefined ? discogsReleaseData.artists_sort : ''

    //// styles
    let styleAsString = []
    const styles = discogsReleaseData.styles ? discogsReleaseData.styles : discogsReleaseData.genres
    styleAsString.push(styles.join(', '))

    //// year handler
    const year =
      discogsReleaseData.year === 0 || discogsReleaseData.year === undefined
        ? ''
        : discogsReleaseData.year
    const inyear =
      discogsReleaseData.year === 0 || discogsReleaseData.year === undefined
        ? ''
        : 'in ' + discogsReleaseData.year + ' '

    //// country handler
    const country =
      discogsReleaseData.country === 0 || discogsReleaseData.country === undefined
        ? '---'
        : discogsReleaseData.country
    const incountry =
      discogsReleaseData.country === 0 || discogsReleaseData.country === undefined
        ? ''
        : 'in ' + discogsReleaseData.country + ' '

    /// uri
    const discogsUri = discogsReleaseData.uri

    /// Count
    const trackCount = discogsReleaseData.tracklist.length

    const releaseDataFinal = {
      id: discogsReleaseData.id,
      artist: releaseArtists,
      title: releaseAlbum,
      albumArtists: albumArtists,
      year: year,
      country: country,
      styles: styles,
      format: formatName,
      formatDescription: formatDescription,
      tracklist: discogsReleaseData.tracklist,
      label: label,
      labelID: labelID,
      labelLink: `https://www.discogs.com/label/${labelID}`,
      styleAsString: styleAsString,
      discogsUri: discogsUri,
      trackCount: trackCount,
      images: discogsReleaseData.images
    }

    return releaseDataFinal
  }
}

module.exports = new DiscogsService()
