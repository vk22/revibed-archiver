const ProjectService = require("../services/projectService");
const DiscogsService = require("../services/discogsService");
const FilesService = require("../services/filesService");
const ErrorsService = require("../services/errorsService");


class MainController {
  async checkDropedFolder(req, res) {
    try {
      console.log('checkDropedFolder')
      const folder = req.body.folder;
      FilesService.setInitialData(folder);
      const folderFiles = await FilesService.parseFiles(folder, true);
      res.json({
        success: true,
        files: folderFiles
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
      const source = req.body.source
      const result = await FilesService.archiveProject(source)
      res.json({
        success: true,
        result: result
      })
    } catch (e) {
      res.status(500).json(e)
    }
  }
}

module.exports = new MainController();