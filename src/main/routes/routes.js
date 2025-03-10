const express = require('express')
const router = express.Router()
const MainController = import('../controllers/mainController')
// const DiscogsController = require('../controllers/discogsController')
// const exportController = require('../controllers/exportController')

////
router.post('/api/check-droped-folder', MainController.checkDropedFolder)
router.post('/api/get-files-from-folder', MainController.getFilesFromFolder)
router.post('/api/set-discogs-tags', MainController.setDiscogsTags)
router.post('/api/edit-image/', MainController.editImage)
router.post('/api/archive-project', MainController.archiveProject)
router.post('/api/delete-file/', MainController.deleteFile)
///
router.post('/api/parse-discogs-link', MainController.parseRelease)
router.post('/api/download-discogs-images', MainController.downloadDiscogsImages)

//// export
router.post('/api/export-releases-to-rvbd', MainController.getReleaseForRVBD)
router.post('/api/export-releases-to-youtube', MainController.getReleaseForYoutube)
router.post('/api/update-revibed', MainController.updateRevibedDB)

//// user data
router.post('/api/user/set-local-data', MainController.setUserLocalData)
router.get('/api/user/get-local-data', MainController.getUserLocalData)

module.exports = router
