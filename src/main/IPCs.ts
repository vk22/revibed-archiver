import { ipcMain, shell, IpcMainEvent, dialog } from 'electron'
import Constants from './utils/Constants'
import MainController from './mainController.js'
import fs from 'node:fs/promises'

/*
 * IPC Communications
 * */
export default class IPCs {
  static initialize(): void {
    /// user
    ipcMain.handle('getUserLocalData', async () => {
      return await MainController.getUserLocalData()
    })

    ipcMain.handle('setUserLocalData', async (event, data) => {
      return await MainController.setUserLocalData(data)
    })

    /// files
    ipcMain.handle('checkDropedFolder', async (event, data) => {
      return await MainController.checkDropedFolder(data)
    })
    ipcMain.handle('getFilesFromFolder', async (event, data) => {
      return await MainController.getFilesFromFolder(data)
    })
    ipcMain.handle('setDiscogsTags', async (event, data) => {
      return await MainController.setDiscogsTags(data)
    })
    ipcMain.handle('setID3TagsOneTrack', async (event, data) => {
      return await MainController.setID3TagsOneTrack(data)
    })
    ipcMain.handle('editImage', async (event, data) => {
      return await MainController.editImage(data)
    })
    ipcMain.handle('archiveProject', async (event, data) => {
      return await MainController.archiveProject(data)
    })
    ipcMain.handle('deleteFile', async (event, data) => {
      return await MainController.deleteFile(data)
    })
    ipcMain.handle('parseRelease', async (event, data) => {
      return await MainController.parseRelease(data)
    })
    ipcMain.handle('downloadDiscogsImages', async (event, data) => {
      return await MainController.downloadDiscogsImages(data)
    })
    ipcMain.handle('getReleaseForRVBD', async (event, data) => {
      return await MainController.getReleaseForRVBD(data)
    })
    ipcMain.handle('getReleaseForYoutube', async (event, data) => {
      return await MainController.getReleaseForYoutube(data)
    })
    ipcMain.handle('checkFiles', async (event, data) => {
      return await MainController.checkFiles(data)
    })
    ipcMain.handle('readFile', (event, filePath) => {
      return fs.readFile(filePath, 'utf-8')
    })

    // Open url via web browser
    ipcMain.on('msgOpenExternalLink', async (event: IpcMainEvent, url: string) => {
      await shell.openExternal(url)
    })

    // Open file
    ipcMain.handle('msgOpenFile', async (event, filter: string) => {
      const filters = []
      if (filter === 'text') {
        filters.push({ name: 'Text', extensions: ['txt', 'json'] })
      } else if (filter === 'zip') {
        filters.push({ name: 'Zip', extensions: ['zip'] })
      }
      const dialogResult = await dialog.showOpenDialog({
        properties: ['openFile'],
        filters
      })
      return dialogResult
    })
  }
}
