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
    this.characterComparisonFavorites = properties.characterComparisonFavorites
    this.getCharacterValuesMap = properties.getCharacterValuesMap
    
    this.root = document.createElement("div")
    this.root.classList.add("main-content-view")
  }

  getView() {
    return this.root
  }

  updateView() {

  }

  viewWillDisappear() {
    
  }
}