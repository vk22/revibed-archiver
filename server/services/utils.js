const fs = require('fs')

function prepareReleaseData(discogsReleaseData) {
  return new Promise(function (resolve, reject) {
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
    const releaseArtists = artistNameHandler(artistData)
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

    resolve(releaseDataFinal)
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

function removeRawFromName(str) {
  return str.substring(0, str.toUpperCase().trim().indexOf('RAW'))
}

function base64_encode(file) {
  return 'data:image/gif;base64,' + fs.readFileSync(file, 'base64')
}

function createLineageFile(releaseDataPrepared, ripFolderPath) {
  return new Promise(function (resolve, reject) {
    //// lineageText
    lineageText =
      `Release info:\r\n\r\n` +
      `Release: ${releaseDataPrepared.artist} - ${releaseDataPrepared.title}\r\n` +
      `Format: ${releaseDataPrepared.format}, ${releaseDataPrepared.formatDescription}\r\n` +
      `Origin: ${releaseDataPrepared.country}\r\n` +
      `Style: ${releaseDataPrepared.styleAsString}\r\n` +
      `Year: ${releaseDataPrepared.year}\r\n\r\n` +
      `Discogs link: ${releaseDataPrepared.discogsUri}\r\n\r\n` +
      `Item condition: ${releaseDataPrepared.media}/${releaseDataPrepared.sleeve}\r\n\r\n` +
      `Cleaning, processing and postproduction had been executed at the KollektivX Sound Lab.\r\n\r\n` +
      `24/96 RAW (FLAC)\r\n` +
      `16/44.1 RESTORED (FLAC)\r\n\r\n` +
      `ATTENTION: KollektivX may insert hidden identifiers that uniquely identifies it as the copy you received from the Company.\r\n\r\n` +
      `PLEASE NOTE THAT YOU MAY OWN A DIGITAL COPY OF THE ITEMS AS LONG AS YOU OWN THE PHYSICAL MEDIA. YOU ARE SOLELY RESPONSIBLE FOR COPYRIGHT COMPLIANCE.\r\n\r\n` +
      `In particular, any unauthorised use of copyright protected material (including by way of reproduction, distribution, modification, adaptation, public display, public performance, preparation of derivative works, making available or otherwise communicating to the public) may constitute an infringement of third party rights. Any such infringements may also result in civil litigation or criminal prosecution by or on behalf of the relevant rights holder.\r\n\r\n` +
      `KX#${releaseDataPrepared.projectID}`

    //// lineage file create
    fs.writeFile(ripFolderPath + 'Lineage KollektivX.txt', lineageText, function (err) {
      if (err) return console.log(err)
      //console.log("Lineage KollektivX.txt done ", ripFolderPath);

      resolve(true)
    })
  }).then((result) => {
    return result
  })
}

function renameFolder(data) {
  return new Promise(function (resolve, reject) {
    console.log('renameFolder 2', data)
    const newRipFolderPath =
      data.rootFolder +
      data.projectData.artist.replaceAll('/', '\u2215') +
      ' - ' +
      data.projectData.title.replaceAll('/', '\u2215') +
      ' (KX#' +
      data.projectData.projectID +
      ')'
    const newRipFolderPath1 = newRipFolderPath + '/doNOTdistribute'
    const newRipFolderPath2 = newRipFolderPath1 + '/removeONCErecordSOLD'

    if (!fs.existsSync(newRipFolderPath)) {
      fs.mkdirSync(newRipFolderPath)
    }
    if (!fs.existsSync(newRipFolderPath1)) {
      fs.mkdirSync(newRipFolderPath1)
    }

    try {
      fs.renameSync(data.ripFolder, newRipFolderPath2)
      console.log('Successfully renamed the directory.')
      const finalFolder = newRipFolderPath2
      resolve(finalFolder)
    } catch (err) {
      console.log(err)
    }
  })
}

module.exports = {
  prepareReleaseData,
  getArtistName,
  artistNameHandler,
  removeRawFromName,
  base64_encode,
  createLineageFile,
  renameFolder
}
