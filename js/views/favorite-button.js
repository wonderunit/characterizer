const EventEmitter = require('events').EventEmitter

const ON_ICON_PATH = "images/favorite-selected.svg"
const OFF_ICON_PATH = "images/favorite-unselected.svg"

module.exports = class MainBaseView extends EventEmitter {
  constructor(properties={}) {
    super()
    this.handleClick = this.handleClick.bind(this)
    
    this.root = document.createElement("div")
    let className = properties.className ? properties.className : "favorite-button-container"
    this.root.classList.add(className)
    
    this.icon = document.createElement("img")
    this.icon.setAttribute("src", OFF_ICON_PATH)
    this.root.appendChild(this.icon)
    this.handler = properties.handler
    this.setChecked(properties.hasOwnProperty("checked") ? properties.checked : false)
    this.setEnabled(properties.enabled)
  }

  setEnabled(enabled) {
    this.enabled = enabled
    if(this.enabled) {
      this.root.addEventListener("click", this.handleClick)
    } else {
      this.root.removeEventListener("click", this.handleClick)
    }
  }

  handleClick(event) {
    if(this.handler) {
      this.handler()
    }
  }

  setHandler(handler) {
    this.handler = handler
  }

  setChecked(checked) {
    this.checked = checked
    this.updateView()
  }

  getView() {
    return this.root
  }

  updateView() {
    if(this.checked) {
      this.icon.setAttribute("src", ON_ICON_PATH)
    } else {
      this.icon.setAttribute("src", OFF_ICON_PATH)
    }
  }

  viewWillDisappear() {
    this.root.removeEventListener(this.handler)
  }
}