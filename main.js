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

let win

function createWindow () {
  win = new BrowserWindow({width: 800, height: 600})
  win.loadURL(url.format({
    pathname: path.join(__dirname, 'welcome-window.html'),
    protocol: 'file:',
    slashes: true
  }))

  win.on('closed', () => {
    win = null
  })
}

app.on('ready', createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (win === null) {
    createWindow()
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
  var knex = require('knex')({
    client: 'sqlite3',
    connection: {
      filename: dbFile
    }
  })
  global.knex = knex

  initDB(knex, {valuesSeedDataPath})
    .then(()=>{
      if(win) {
        win.close()
      }
      win = new BrowserWindow({width: 800, height: 600})
      win.loadURL(url.format({
        pathname: path.join(__dirname, 'main-window.html'),
        protocol: 'file:',
        slashes: true
      }))
    
      win.on('closed', () => {
        win = null
      })

    })
    .catch(console.error)
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