const EventEmitter = require('events').EventEmitter

module.exports = class MainBaseView extends EventEmitter {
  constructor(properties) {
    super()
    this.isLight = true

    this.root = document.createElement("div")
    this.root.setAttribute("id", "background-view")
    this.root.classList.add("background-view")

    this.darkBackground = document.createElement("div")
    this.darkBackground.classList.add("background-darkblue")
    this.root.appendChild(this.darkBackground)
  }

  getView() {
    return this.root
  }

  nextBackground() {
    this.isLight = !this.isLight
    if(this.isLight) {
      this.darkBackground.classList.remove("hidden-background")
    } else {
      this.darkBackground.classList.add("hidden-background")
    }

  }

  updateView() {

  }

  viewWillDisappear() {
    
  }

}