const express = require('express')
const router = express.Router()
const newRipController = require('../controllers/newRipController')
const exportController = require('../controllers/exportController')

////
router.post('/api/parse-discogs-link', newRipController.parseRelease)

////
router.post('/api/download-discogs-images', newRipController.downloadDiscogsImages)

////
router.post('/api/check-droped-folder', newRipController.checkDropedFolder)

////
router.post('/api/get-files-from-folder', newRipController.getFilesFromFolder)

////
router.post('/api/set-metadata-one-track', newRipController.setID3TagsOneTrack)

////
router.post('/api/set-discogs-tags', newRipController.setDiscogsTags)

////
router.post('/api/check-files', newRipController.checkFiles)

////
router.post('/api/archive-project', newRipController.archiveProject)

////
router.post('/api/edit-rip-tracklist/', newRipController.getReleaseTracklist)

////
router.post('/api/edit-image/', newRipController.editImage)

////
router.post('/api/delete-file/', newRipController.deleteFile)

////
router.get('/api/get-projects', newRipController.getProjectsStore)

//// export
router.post('/api/export-releases-to-rvbd', exportController.getReleaseForRVBD)

//// export
router.post('/api/export-releases-to-youtube', exportController.getReleaseForYoutube)

//// export
router.post('/api/update-releases-to-rvbd', exportController.updateRelaesesForRVBD)

module.exports = router
