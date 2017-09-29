const {app, ipcMain, BrowserWindow, dialog} = require('electron')
const path = require('path')
const url = require('url')
const fs = require('fs')
const userDataPath = app.getPath('userData')
const valuesSeedDataPath = path.join(__dirname, "data", "values.txt")
const {initDB} = require('./js/database-init.js')
const prefModule = require('./js/prefs.js')
const utils = require('./js/utils.js')
const trash = require('trash')

let welcomeWindow
let loadingStatusWindow
let mainWindow

function createWelcomeWindow () {
  welcomeWindow = new BrowserWindow({width: 800, height: 600})
  welcomeWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'welcome-window.html'),
    title: "Characterizer",
    protocol: 'file:',
    slashes: true
  }))

  welcomeWindow.on('closed', () => {
    mainWindow = null
  })
}

app.on('ready', createWelcomeWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

ipcMain.on('open-project', (e, arg)=>{
  showMainWindow(arg)
  addToRecentDocs(arg)
})

ipcMain.on('browse-for-project', (e, arg)=> {
  browseForProject()
})

function browseForProject() {
  let properties = {
    title:"Open Script", 
    filters:[
      {
        name: 'Database File', 
        extensions: ['sqlite']
      }
    ]
  }
  dialog.showOpenDialog(properties, (filenames)=>{
      if (filenames) {
        showMainWindow(filenames[0])
        addToRecentDocs(filenames[0])
      }
  })
}

ipcMain.on('new-project', (e, arg)=> {
  createNewProject()
})

ipcMain.on('log', (event, opt) => {
  !loadingStatusWindow.isDestroyed() && loadingStatusWindow.webContents.send('log', opt)
})

ipcMain.on('workspace-ready', event => {
  mainWindow && mainWindow.show()
  !loadingStatusWindow.isDestroyed() && loadingStatusWindow.hide()
})


function createNewProject() {
  let properties = {
    title: "New Project",
    buttonLabel: "Create",
  }
  dialog.showSaveDialog(properties, filename => {
    if(!filename) {
      return
    }
    function openWindow() {
      fs.mkdirSync(filename)      
      let projectName = path.basename(filename)
      let dbFileName = path.join(filename, projectName + '.sqlite')
      showMainWindow(dbFileName)
      addToRecentDocs(dbFileName)
    }

    if(fs.existsSync(filename)) {
      if(fs.lstatSync(filename).isDirectory()) {
        console.log('\ttrash existing folder', filename)
        trash(filename)
          .then(openWindow)
          .catch(console.error)
      } else {
        dialog.showMessageBox(null, {
          message: "Could not overwrite file " + path.basename(filename) + ". Only folders can be overwritten." 
        })
        return
      }
    } else {
      openWindow()
    }
  })
}

function showMainWindow(dbFile) {
  let basename = path.basename(dbFile)

  loadingStatusWindow = new BrowserWindow({
    width: 450,
    height: 150,
    backgroundColor: '#333333',
    show: false,
    frame: false,
    resizable: false
  })

  loadingStatusWindow.loadURL(`file://${__dirname}/loading-status.html?name=${basename}`)
  loadingStatusWindow.once('ready-to-show', () => {
    loadingStatusWindow.show()
  })

  try {
    var knex = require('knex')({
      client: 'sqlite3',
      connection: {
        filename: dbFile
      }
    })
    global.knex = knex
    
    initDB(knex, {valuesSeedDataPath})
    .then(()=>{
      if(mainWindow) {
        mainWindow.close()
      }
      mainWindow = new BrowserWindow({
        width: 800, 
        height: 600, 
        show: false,
        title: basename,
      })
      mainWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'main-window.html'),
        protocol: 'file:',
        slashes: true
      }))
      
      mainWindow.on('closed', () => {
        mainWindow = null
      })
      
    })
    .catch(console.error)
  } catch(e) {
    loadingStatusWindow.webContents.send('log', {message: e.toString()})
  }

}

let addToRecentDocs = (filename, metadata={}) => {
  let prefs = prefModule.getPrefs('add to recent')

  let recentDocuments
  if (!prefs.recentDocuments) {
    recentDocuments = []
  } else {
    recentDocuments = JSON.parse(JSON.stringify(prefs.recentDocuments))
  }

  let currPos = 0

  for (var document of recentDocuments) {
    if (document.filename == filename) {
      recentDocuments.splice(currPos, 1)
      break
    }
    currPos++
  }

  let recentDocument = metadata

  if (!recentDocument.title) {
    let title = filename.split(path.sep)
    title = title[title.length-1]
    title = title.split('.')
    title.splice(-1,1)
    title = title.join('.')
    recentDocument.title = title
  }

  recentDocument.filename = filename
  recentDocument.time = Date.now()
  recentDocuments.unshift(recentDocument)
  // save
  prefModule.set('recentDocuments', recentDocuments)
}