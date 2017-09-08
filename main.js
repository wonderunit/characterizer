const {app, ipcMain, BrowserWindow, dialog} = require('electron')
const path = require('path')
const url = require('url')
const fs = require('fs')
const userDataPath = app.getPath('userData')
const dbFileName = path.join( userDataPath, "characterizer.sqlite")
const valuesSeedDataPath = path.join(__dirname, "data", "values.txt")
const {initDB} = require('./js/database-init.js')


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

ipcMain.on('open-project', (e, arg)=> {
  openProject()
})

function openProject() {
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
    if(fs.existsSync(filename)) {
      if(fs.lstatSync(filename).isDirectory()) {
        console.log('\ttrash existing folder', filename)
        tasks = tasks.then(() => trash(filename)).catch(err => reject(err))
      } else {
        dialog.showMessageBox(null, {
          message: "Could not overwrite file " + path.basename(filename) + ". Only folders can be overwritten." 
        })
        return
      }
    }

    fs.mkdirSync(filename)      
    let projectName = path.basename(filename)
    let dbFileName = path.join(filename, projectName + '.sqlite')
    showMainWindow(dbFileName)
  })
}

function showMainWindow(dbFile) {
  var knex = require('knex')({
    client: 'sqlite3',
    connection: {
      filename: dbFileName
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