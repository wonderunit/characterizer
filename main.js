const {app, BrowserWindow} = require('electron')
const path = require('path')
const url = require('url')
const userDataPath = app.getPath('userData')
const dbFileName = path.join( userDataPath, "characterizer.sqlite")
const valuesSeedDataPath = path.join(__dirname, "data", "values.txt")
console.log(dbFileName)

var knex = require('knex')({
  client: 'sqlite3',
  connection: {
    filename: dbFileName
  }
})
global.knex = knex

const {initDB} = require('./js/database-init.js')


let win

function createWindow () {
  
  // Setup the database.
  initDB(knex, {valuesSeedDataPath})
    .then(()=>{
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