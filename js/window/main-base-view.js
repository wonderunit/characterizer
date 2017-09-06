const EventEmitter = require('events').EventEmitter

module.exports = class MainBaseView extends EventEmitter {
  constructor(properties) {
    super()
    this.getCharacterValues = properties.getCharacterValues
    this.getBattlePairer = properties.getBattlePairer
    this.getCharacters = properties.getCharacters
    this.valuesMap = properties.valuesMap
    
    this.root = document.createElement("div")
  }

  getView() {
    return this.root
  }

  updateView() {

  }
}