const CharacterComparisonBaseView = require('./character-comparison-base-view.js')
const CharacterView = require('./character-selector-multiple.js')
const CharacterComparisonAverageView = require('./character-comparison-average-view.js')

module.exports = class CharacterComparisonView extends CharacterComparisonBaseView {
  constructor(properties) {
    super(properties)
    this.valuesViewType = "average"
    
    this.comparisonView = document.createElement("div")
    this.comparisonView.setAttribute("id", "character-comparison-view")
    this.root.appendChild(this.comparisonView)

    this.updateView()
  }


  updateView() {
    this.getSelectedCharacterValues()
      .then(characterValueResults => {
        this.comparisonView.innerHTML = ``
        let ValuesView = this.getValuesView()
        let properties = { 
          valuesMap: this.valuesMap, 
          characters: this.selectedCharacters,
          values: characterValueResults
        }
        let curValuesView = new ValuesView(properties)
        this.root.replaceChild(curValuesView.getView(), this.comparisonView)
        this.comparisonView = curValuesView.getView()
      })
      .catch(console.error)
  }

  getValuesView() {
    switch(this.valuesViewType) {
      case "average":
      default:
        return CharacterComparisonAverageView
    }
  }
}