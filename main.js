const {app, BrowserWindow} = require('electron')
const path = require('path')
const url = require('url')
var knex = require('knex')({
  client: 'sqlite3',
  connection: {
    filename: "./characterizer.sqlite"
  }
})
global.knex = knex

const {initDB} = require('./js/database-init.js')


let win

function createWindow () {
  win = new BrowserWindow({width: 800, height: 600})
  win.loadURL(url.format({
    pathname: path.join(__dirname, 'main-window.html'),
    protocol: 'file:',
    slashes: true
  }))

  win.on('closed', () => {
    win = null
  })

  // Setup the database.
  initDB(knex)
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