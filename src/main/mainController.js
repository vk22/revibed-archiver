import UserService from './userService.js'
import ProjectService from './projectService.js'
import DiscogsService from './discogsService.js'
import FilesService from './filesService.js'
import ExportService from './exportService.js'
import ErrorsService from './errorsService.js'

class MainController {
  async checkDropedFolder(data) {
    try {
      console.log('checkDropedFolder')
      const folder = data.folder
      FilesService.setInitialData(folder)
      const folderFiles = await FilesService.parseFiles(folder, true)
      const errors = ErrorsService.getAll()
      ErrorsService.clear()
      return {
        success: true,
        files: folderFiles,
        errors: errors
      }
    } catch (e) {
      console.log('eee ', e)
      res.status(500).json(e)
    }
  }
  async getFilesFromFolder() {
    try {
      const folderFiles = await FilesService.getFilesFromFolder()
      return {
        success: true,
        files: folderFiles
      }
    } catch (e) {
      return false
    }
  }
  async setDiscogsTags(data) {
    try {
      console.log('setDiscogsTags')
      const matchType = data.matchType
      await FilesService.setMainImage(data.mainImage)
      await FilesService.setMetadata(matchType)
      return {
        success: true,
        message: 'all good'
      }
    } catch (e) {
      return false
    }
  }
  async setID3TagsOneTrack(data) {
    const metadata = data.metadata
    const filepath = data.filepath
    const result = await FilesService.setID3Tags(metadata, filepath)
    //console.log('result ', result)
    return {
      success: true,
      result: result
    }
  }
  async editImage(data) {
    try {
      const oldPath = data.oldPath
      const newPath = data.newPath
      const imageSize = data.imageSize ? +data.imageSize.split('x')[0] : 0
      const result = await FilesService.convertImage(oldPath, newPath, imageSize)
      return result
    } catch (e) {
      return false
    }
  }
  async archiveProject(data) {
    try {
      const source = data.source
      const result = {
        archiver: undefined,
        revibed: undefined
      }
      const responseArchiver = await FilesService.archiveProject()
      console.log('responseArchiver ', responseArchiver)
      result.archiver = responseArchiver

      if (responseArchiver.success) {
        ///// Save To Revibed
        const responseRevibed = await ProjectService.sendToRevibed(source)
        console.log('responseRevibed ', responseRevibed)
        result.revibed = responseRevibed
      }
      return {
        success: true,
        result: result
      }
    } catch (e) {
      console.log('archiveProject error ', e)
      return false
    }
  }
  async deleteFile(data) {
    try {
      const filename = data.filename
      const result = await FilesService.deleteFile(filename)
      return result
    } catch (err) {
      return false
    }
  }
  /// discogs
  async parseRelease(data) {
    try {
      const releaseID = data.releaseID
      const discogsMergeSubtracks = data.discogsMergeSubtracks
      const { releaseData } = await DiscogsService.getRelease(releaseID, discogsMergeSubtracks)
      console.log('parseRelease releaseData ', releaseData)
      const result = {
        success: true,
        releaseData: releaseData,
        errors: []
      }
      return result
    } catch (e) {
      return false
    }
  }
  async downloadDiscogsImages() {
    try {
      const { discogsImages } = await DiscogsService.downloadDiscogsImages()
      const result = {
        success: true,
        images: discogsImages,
        errors: []
      }
      return result
    } catch (e) {
      return false
    }
  }
  /// export
  async getReleaseForRVBD(data) {
    try {
      const releases = data.releases
      const userFolders = await UserService.getUserData()
      const result = await ExportService.getReleaseForRVBD(releases, userFolders)
      return result
    } catch (e) {
      return false
    }
  }
  async getReleaseForYoutube(data) {
    console.log('getReleaseForYoutube ', data)
    try {
      const releases = data.releases
      const userFolders = await UserService.getUserData()
      const result = await ExportService.sendReleasesToYoutube(releases, userFolders)
      return result
    } catch (e) {
      return false
    }
  }
  /// user
  async setUserLocalData(data) {
    console.log('setUserLocalData ', data)
    const setData = await UserService.setUserData(data)
    console.log('setData ', setData)
    if (setData) {
      return {
        success: true
      }
    }
  }
  async getUserLocalData() {
    console.log('getUserLocalData start')
    const data = await UserService.getUserData()
    console.log('getUserLocalData data')
    if (data) {
      return data
    } else {
      return false
    }
  }
}

export default new MainController()
