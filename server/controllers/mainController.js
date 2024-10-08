const ProjectService = require("../services/projectService");
const DiscogsService = require("../services/discogsService");
const FilesService = require("../services/filesService");
const ExportService = require("../services/exportService");
const ErrorsService = require("../services/errorsService");
const UserService = require("../services/userService");


class MainController {
  async checkDropedFolder(req, res) {
    try {
      console.log('checkDropedFolder')
      const folder = req.body.folder;
      FilesService.setInitialData(folder);
      const folderFiles = await FilesService.parseFiles(folder, true);
      const errors = ErrorsService.getAll()
      ErrorsService.clear()
      res.json({
        success: true,
        files: folderFiles,
        errors: errors
      })

    } catch (e) {
      console.log('eee ', e)
      res.status(500).json(e)
    }
  }
  async getFilesFromFolder(req, res) {
    try {
      const folderFiles = await FilesService.getFilesFromFolder();
      res.json({
        success: true,
        files: folderFiles
      })
    } catch (e) {
      res.status(500).json(e)
    }
  }
  async parseRelease(req, res) {
    try {
      const releaseID = req.body.releaseID
      const discogsMergeSubtracks = req.body.discogsMergeSubtracks
      const { releaseData } = await DiscogsService.getRelease(releaseID, discogsMergeSubtracks)
      console.log('parseRelease releaseData ', releaseData)
      const result = {
        success: true,
        releaseData: releaseData,
        errors: []
      }
      res.json(result)
    } catch (e) {
      res.status(500).json(e)
    }

  }
  async downloadDiscogsImages(req, res) {
    try {
      const { discogsImages } = await DiscogsService.downloadDiscogsImages()
      const result = {
        success: true,
        images: discogsImages,
        errors: []
      }
      res.json(result)
    } catch (e) {
      res.status(500).json(e)
    }

  }
  async editImage(req, res) {
    try {
      const oldPath = req.body.oldPath;
      const newPath = req.body.newPath;
      const imageSize = req.body.imageSize ? +req.body.imageSize.split('x')[0] : 0;
      const result = await FilesService.convertImage(oldPath, newPath, imageSize)
      res.send(result);
    } catch (e) {
      res.status(500).json(e)
    }
  }
  async deleteFile(req, res) {
    try {
      const filename = req.body.filename;
      const result = await FilesService.deleteFile(filename);
      res.send(result);
    } catch (err) {
      res.status(500).json(e)
    }
  }
  async setDiscogsTags(req, res) {
    try {
      console.log('setDiscogsTags')
      const matchType = req.body.matchType
      await FilesService.setMainImage(req.body.mainImage)
      await FilesService.setMetadata(matchType)
      res.json({
        success: true,
        message: 'all good'
      })
    } catch (e) {
      res.status(500).json(e)
    }

  }
  async archiveProject(req, res) {
    try {
      // console.log('archiveProject req.body', req.body)
      const source = req.body.source
      const result = {
        archiver: undefined,
        revibed: undefined
      }
      const responseArchiver = await FilesService.archiveProject();
      console.log('responseArchiver ', responseArchiver)
      result.archiver = responseArchiver;

      if (responseArchiver.success) {
        ///// Save To Revibed
        const responseRevibed = await ProjectService.sendToRevibed(source)
        console.log('responseRevibed ', responseRevibed)
        result.revibed = responseRevibed
      }
      res.json({
        success: true,
        result: result,
      })
    } catch (e) {
      console.log('archiveProject error ', e)
      res.status(500).json(e)
    }
  }
  async getReleaseForYoutube(req, res) {
    const releases = req.body.releases
    const result = await ExportService.sendReleasesToYoutube(releases)
    res.json(result)
  }
  async getReleaseForRVBD(req, res) {
    const releases = req.body.releases
    const userFolders = await UserService.getUserData();
    const result = await ExportService.getReleaseForRVBD(releases, userFolders)
    res.json(result)
  }
  async updateRevibedDB(req, res) {
    const releases = req.body.releases
    const userFolders = await UserService.getUserData();
    const result = await ExportService.updateRevibedDB(releases, userFolders)
    res.json(result)
  }
  async setUserLocalData(req, res) {
    const data = req.body.data;
    console.log('setUserLocalData ', data)
    const setData = await UserService.setUserData(data);
    if (setData.success) {
      res.json({
        success: true
      })
    }
  }
  async getUserLocalData(req, res) {
    const data = await UserService.getUserData();
    if (data) {
      res.json(data)
    } else {
      res.status(500).json(e)
    }
  }

}

module.exports = new MainController();