const EventEmitter = require('events').EventEmitter
const ValuesViewAverage = require('./values-views/values-view-average.js')

module.exports = class CharacterComparisonAverageView extends EventEmitter {
  constructor(properties) {
    super()
    this.characters = properties.characters
    this.valuesMap = properties.valuesMap
    this.values = properties.values
    this.root = document.createElement("div")
    this.root.setAttribute("id", "character-comparison-view")
    this.updateView()
  }

  getView() {
    return this.root
  }

  updateView() {
    let targetWidth = 100/this.characters.length
    let index = 0
    for(let character of this.characters) {
      let containerDiv = document.createElement("div")
      containerDiv.classList.add("comparison-character-view-container")
      containerDiv.setAttribute("style", `width: ${targetWidth}%;`)
      let nameContainer = document.createElement("h2")
      nameContainer.innerHTML = character.name
      containerDiv.appendChild(nameContainer)
      let properties = { 
        valuesMap: this.valuesMap, 
        values: this.values[index]
      }
      let curValuesView = new ValuesViewAverage(properties)
      containerDiv.appendChild(curValuesView.getView())
      this.root.appendChild(containerDiv)
      index++
    }
  }
}