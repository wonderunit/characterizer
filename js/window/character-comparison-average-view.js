const EventEmitter = require('events').EventEmitter

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
      let curValuesView = this.getScoresView(this.values[index])
      containerDiv.appendChild(curValuesView)
      this.root.appendChild(containerDiv)
      index++
    }
  }

  getScoresView(values) {
    let result = document.createElement('div')
    result.setAttribute("id", "values-view")
    for(let value of values) {
      let valueView = document.createElement('div')
      valueView.setAttribute("class", "value-list-name")
      let progressView = document.createElement('div')
      progressView.setAttribute("class", "value-list-progress")
      progressView.setAttribute("style", `width: ${value.score*100}%`)
      valueView.appendChild(progressView)
      let nameView = document.createElement('div')
      nameView.setAttribute("class", "value-list-label")
      nameView.innerHTML = `${this.valuesMap[value.valueID.toString()].name} | ${value.score} | Wins: ${value.wins}, Losses: ${value.losses} | Battles: ${value.battleCount}`
      valueView.appendChild(nameView)
      result.appendChild(valueView)
    }

    return result
  }
}