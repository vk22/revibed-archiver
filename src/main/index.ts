import {
  app,
  WebContents,
  RenderProcessGoneDetails,
  utilityProcess,
  Menu,
  MenuItem,
  shell
} from 'electron'
import Constants from './utils/Constants'
import { createErrorWindow, createMainWindow } from './MainRunner'
import contextMenu from 'electron-context-menu'
import MainController from './mainController.js'

contextMenu({
  prepend: (defaultActions, parameters, browserWindow) => [
    {
      label: 'Rainbow',
      // Only show it when right-clicking images
      visible: parameters.mediaType === 'image'
    },
    {
      label: 'Show in Finder for “{selection}”',
      // Only show it when right-clicking text
      //visible: parameters.selectionText.trim().length > 0,
      visible: true,
      click: async () => {
        console.log(parameters)
        const userLocalFolders = await MainController.getUserLocalData()
        const path = `${userLocalFolders.storageFolder}/${parameters.selectionText}`
        shell.openPath(path)
        // shell.openExternal(`https://google.com/search?q=${encodeURIComponent(parameters.selectionText)}`);
      }
    }
  ]
})

let mainWindow
let errorWindow

// require('../../server/index')

app.on('ready', async () => {
  if (Constants.IS_DEV_ENV) {
    import('./index.dev')
  }

  // Disable special menus on macOS by uncommenting the following, if necessary
  /*
  if (Constants.IS_MAC) {
    systemPreferences.setUserDefault('NSDisabledDictationMenuItem', 'boolean', true)
    systemPreferences.setUserDefault('NSDisabledCharacterPaletteMenuItem', 'boolean', true)
  }
  */

  mainWindow = await createMainWindow(mainWindow)
})

app.on('activate', async () => {
  if (!mainWindow) {
    mainWindow = await createMainWindow(mainWindow)
  }
})

app.on('window-all-closed', () => {
  mainWindow = null
  errorWindow = null

  if (!Constants.IS_MAC) {
    app.quit()
  }
})

app.on(
  'render-process-gone',
  (event: Event, webContents: WebContents, details: RenderProcessGoneDetails) => {
    errorWindow = createErrorWindow(errorWindow, mainWindow, details)
  }
)

process.on('uncaughtException', () => {
  errorWindow = createErrorWindow(errorWindow, mainWindow)
})
