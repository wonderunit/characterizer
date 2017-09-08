const {ipcRenderer, shell, remote} = require('electron')
const knex = remote.getGlobal('knex')

let container = document.getElementById("container")

let recentContainer = document.createElement("div")
recentContainer.setAttribute("id", "recent-container")
container.appendChild(recentContainer)

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
  ipcRenderer.send('open-project')
})
buttonContainer.appendChild(openButton)

