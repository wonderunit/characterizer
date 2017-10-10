const EventEmitter = require('events').EventEmitter

module.exports = class MainBaseView extends EventEmitter {
  constructor(properties) {
    super()
    this.getCharacterValues = properties.getCharacterValues
    this.getBattlePairer = properties.getBattlePairer
    this.getCharacters = properties.getCharacters
    this.getCharacterBattleCount = properties.getCharacterBattleCount
    this.getCharacterSession = properties.getCharacterSession
    this.getCharacterValueFavorites = properties.getCharacterValueFavorites
    this.getSelectedCharacters = properties.getSelectedCharacters
    this.valuesMap = properties.valuesMap
    this.valueComparisonFavorites = properties.valueComparisonFavorites
    
    this.root = document.createElement("div")
  }

  getView() {
    return this.root
  }

  updateView() {

  }

  viewWillDisappear() {
    
  }
}