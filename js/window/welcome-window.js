const {ipcRenderer, shell, remote} = require('electron')
const knex = remote.getGlobal('knex')
const prefsModule = require('electron').remote.require('./js/prefs.js')

let container = document.getElementById("container")

let recentContainer = document.createElement("div")
recentContainer.setAttribute("id", "recent-container")
let recentHeader = document.createElement("h2")
recentHeader.classList.add("recent-documents-header")
recentHeader.innerHTML = `Recent Documents`
recentContainer.appendChild(recentHeader)
container.appendChild(recentContainer)

let recentDocumentsList = document.createElement("div")
recentDocumentsList.classList.add("recent-documents-list")
recentContainer.appendChild(recentDocumentsList)
let recentDocuments = prefsModule.getPrefs('welcome')['recentDocuments']
if (recentDocuments && recentDocuments.length>0) {
  for (var recentDocument of recentDocuments) {
    let recent = document.createElement("div")
    recent.classList.add("recent-document")
    recent.classList.add("button")
    recent.innerHTML = recentDocument.title
    recent.setAttribute("data-filename", recentDocument.filename)
    recent.addEventListener("click", (event)=>{
      event.target.setAttribute("disabled", true)
      ipcRenderer.send("open-project", event.target.dataset.filename)
    })
    recentDocumentsList.appendChild(recent)
  }
}

let buttonContainer = document.createElement("div")
buttonContainer.setAttribute("id", "button-container")
container.appendChild(buttonContainer)

let newButton = document.createElement("div")
newButton.innerHTML = "New Project"
newButton.classList.add("button")
newButton.addEventListener('click', event => {
  ipcRenderer.send('new-project')
})
buttonContainer.appendChild(newButton)

let openButton = document.createElement("div")
openButton.innerText = "Open Project"
openButton.classList.add("button")
openButton.addEventListener('click', event => {
  ipcRenderer.send('browse-for-project')
})
buttonContainer.appendChild(openButton)

