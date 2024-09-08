const fs = require('fs-extra')
const path = require('path')
const { join, extname, basename } = require('path')
const { readID3Tags, setID3Tags, ffmpegImageConvert } = require('./id3Utils')
const MyStore = require('./store.js')
const store = new MyStore({
  configReleases: 'anton-releases-db',
  configLabels: 'anton-label-db'
})
const { getReleaseTracklistByID } = require('./discogsUtils')
const { allowedAudioFormats, allowedVisualFormats } = require('./filesUtils')
const { getImageSize, convertImage, magickConvert } = require('./imageUtils')
const ripsStoreFolder = '/Volumes/WD/KX-rips/'
const IMG_QUALITY = 50
const RESIZE_WIDTH = 900 //px
const sharp = require('sharp')
const Project = require('./project.js')
const project = new Project()

function changeCoverName(name) {
  console.log('changeCoverName ', name)
  let arr = name.split('.')
  let filename = `${arr[0]}-${Math.floor(Math.random() * 10000)}`
  return `${filename}.${arr[1]}`
}

async function parseFiles(list, dir, needConvertCovers) {
  console.log('parseFiles ')
  const visual = []
  const files = []
  const errors = []
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
      const fileFinal = await readID3Tags(fileStart)
      // console.log('fileFinal ', fileFinal)
      files.push(fileFinal)

      /// visual files
    } else if (file[0] !== '.' && allowedVisualFormats.indexOf(fileExt) > -1) {
      if (needConvertCovers) {
        const file2 = changeCoverName(file)
        const fullPath2 = `${dir}/${file2}`
        const magickConvertRes = await ffmpegImageConvert(fullPath, fullPath2)
        console.log('magickConvertRes ', magickConvertRes)
        if (magickConvertRes && fs.existsSync(fullPath)) {
          await fs.unlinkSync(fullPath)
          const imageSize = await getImageSize(fullPath2)
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
        const imageSize = await getImageSize(fullPath)
        console.log('imageSize ', imageSize)

        visual.push({
          filename: file,
          filepath: fullPath,
          imageSize: imageSize,
          errors: fileErrors
        })
      }
    } else {
      project.addErrors(`${file} has forbbiden file extantion`)
    }
  }
  return { files, visual, errors }
}

const checkDropedFolder = async (req, res, next) => {
  console.log('checkDropedFolder ')
  const folder = req.body.folder
  project.clearData()
  const list = fs.readdirSync(folder)
  const folderFiles = await parseFiles(list, folder, true)
  project.setInitialData(folder)
  res.json({
    success: true,
    files: folderFiles,
    project: project
  })
}

const getFilesFromFolder = async (req, res, next) => {
  const folder = req.body.folder
  const list = fs.readdirSync(folder)
  const folderFiles = await parseFiles(list, folder, false)
  res.json({
    success: true,
    files: folderFiles,
    project: project
  })
}

const setID3TagsOneTrack = async (req, res, next) => {
  const metadata = req.body.metadata
  const filepath = req.body.filepath
  const result = await setID3Tags(metadata, filepath)
  //console.log('result ', result)
  res.json({
    success: true,
    result: result
  })
}

//////

const parseRelease = async (req, res, next) => {
  const releaseID = req.body.releaseID
  const discogsMergeSubtracks = req.body.discogsMergeSubtracks
  await project.getRelease(releaseID, discogsMergeSubtracks)
  console.log('parseRelease project ', project)
  const result = {
    success: true,
    releaseData: project.releaseData,
    errors: project.errors
  }
  res.json(result)
}

const downloadDiscogsImages = async (req, res, next) => {
  await project.downloadDiscogsImages()
  console.log('project ', project)
  const result = {
    success: true,
    images: project.discogsImages,
    errors: project.errors
  }
  res.json(result)
}

// const setMainImage = async (req, res, next) => {
//   await project.setMainImage(req.body.path)
//   console.log('setMainImage ', project)
//   res.json({
//     success: true,
//     message: 'all good'
//   })
// }

const checkFiles = async (req, res, next) => {
  await project.getSpectros()
  res.json({
    success: true,
    restoredFilesList: project.restoredFilesList,
    errors: project.errors
  })
}

const setDiscogsTags = async (req, res, next) => {
  console.log('setDiscogsTags')
  const matchType = req.body.matchType
  await project.setMainImage(req.body.mainImage)
  await project.setMetadata(matchType)
  res.json({
    success: true,
    message: 'all good'
  })
}

const archiveProject = async (req, res, next) => {
  const source = req.body.source
  await project.archiveProject(source)
  res.json({
    success: true,
    message: 'all good'
  })
}

const getReleaseTracklist = async (req, res, next) => {
  const projectID = req.body.projectID
  const tracklist = await getReleaseTracklistByID(req.body)
  console.log('tracklist ', tracklist)

  if (tracklist.length) {
    try {
      const ripForEdit = store.get(projectID)
      console.log('ripForEdit ', ripForEdit)
      if (ripForEdit) {
        ripForEdit.tracklist = tracklist
        const saveRip = store.edit(projectID, ripForEdit)
        if (!saveRip) {
          console.log('save Rip error')
        }
      }
    } catch (error) { }
  }
}

async function editImage(req, res, next) {
  // console.log('editImage ', req.body)
  const oldPath = project.rootFolder + req.body.oldPath
  const newPath = project.rootFolder + req.body.newPath + '.jpg'
  const imageSize = req.body.imageSize ? +req.body.imageSize.split('x')[0] : 0
  const convertImageRes = await convertImage(oldPath, newPath, imageSize)
  console.log('convertImageRes ', convertImageRes)
  res.send({
    success: true
  })
}

async function deleteFile(req, res, next) {
  const path = project.rootFolder + req.body.filename
  try {
    if (fs.existsSync(path)) {
      await fs.unlinkSync(path)
    }
    res.send({
      success: true
    })
  } catch (err) {
    console.log(err)
  }
}

////// STORE
const getProjectsStore = (req, res, next) => {
  try {
    // console.log('saveRip ', req.body.rip)
    const projects = store.getAll()
    const filesPath = store.filesPath
    // console.log('rips ', rips)

    res.send({
      success: true,
      projects: projects,
      filesPath: filesPath
    })
  } catch (err) {
    res.send({
      success: false
    })
  }
}

// const addProjectToStore = (req, res, next) => {
//   try {
//     const project = req.body.project
//     project.updated = {}
//     project.updated.$date = Date.now()
//     const getCandidate = store.get(project.releaseID);
//     console.log('getCandidate ', getCandidate)
//     if (!getCandidate) {
//       const saveRip = store.set(project.releaseID, project);
//       if (!saveRip) {
//         console.log('save Rip error')
//       }
//       let newReleaseForRevibed = {
//         releaseID: project.releaseID,
//         title: project.title,
//         artist: project.artist,
//         labelName: project.label,
//         labelID: project.labelID,
//         source: "Anton",
//         updated: Date.now()
//       }
//       saveReleaseToRevibed(newReleaseForRevibed)
//     }

//   } catch (err) {
//    res.send({
//     success: false
//   })
//   }
// }

// function saveReleaseToRevibed(data) {

//   var postData = JSON.stringify(data);

//   const options = {
//       hostname: 'labels.kx-streams.com',
//       port: 80,
//       path: '/api/add-release',
//       method: 'POST',
//       headers: {
//           'content-type': 'application/json',
//           'accept': 'application/json',
//           'x-api-key': 'l74b9ba9qmext9a6ulniigq8'
//       }
//   };

//   const requestPost = http.request(options, (res) => {
//       res.setEncoding('utf8');
//       res.on('data', (chunk) => {
//           console.log(`BODY: ${chunk}`);
//       });
//       res.on('end', () => {
//           console.log('No more data in response.');
//       });
//   });

//   requestPost.on('error', (e) => {
//       console.error(`problem with request: ${e.message}`);
//   });

//   // write data to request body
//   requestPost.write(postData);
//   requestPost.end();
// }

module.exports = {
  checkDropedFolder,
  getFilesFromFolder,
  setID3TagsOneTrack,
  setDiscogsTags,
  checkFiles,
  parseRelease,
  downloadDiscogsImages,
  archiveProject,
  getReleaseTracklist,
  editImage,
  deleteFile,
  getProjectsStore
}
