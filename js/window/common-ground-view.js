const utils = require('../utils.js')
const CharacterComparisonBaseView = require('./character-comparison-base-view.js')
const COMMONNESS_THRESHOLD = .10

module.exports = class CommonGroundView extends CharacterComparisonBaseView {
  constructor(properties) {
    super(properties)

    this.comparisonView = document.createElement("div")
    this.comparisonView.setAttribute("id", "conflict-comparison-view")
    this.root.appendChild(this.comparisonView)
    this.updateView()
  }

  updateView() {
    this.comparisonView.innerHTML = ``
    let headersContainer = document.createElement("div")
    headersContainer.classList.add("comparison-view-conflicts-header-container")
    this.comparisonView.appendChild(headersContainer)

    let container = document.createElement("div")
    container.classList.add("comparison-view-conflicts-values-container")
    for(let i = 0; i<this.selectedCharacters.length; i++) {
      if(i > 0) {
        let vsView = document.createElement("div")
        vsView.innerHTML = `vs`
        headersContainer.appendChild(vsView)
      }
      let characterName = document.createElement("h2")
      characterName.classList.add("comparison-view-conflicts-header")
      characterName.innerHTML = this.selectedCharacters[i].name
      headersContainer.appendChild(characterName)
    }

    let valuesContainer = document.createElement("div")
    this.comparisonView.appendChild(valuesContainer)

    if(this.selectedCharacters.length < 2) {
      valuesContainer.innerHTML = `Please select two characters to show their common ground.`
      return
    }

    let character1ID = this.selectedCharacters[0].id
    let character2ID = this.selectedCharacters[1].id
    let favoritePairs = []
    Promise.all([
      this.getCharacterValuesMap(character1ID),
      this.getCharacterValuesMap(character2ID)
    ])
    .then(results => {
      let characterValueMap1 = results[0]
      let characterValueMap2 = results[1]

      let commonValues = []
      for(let valueID in characterValueMap1) {
        let character1Value = characterValueMap1[valueID]
        let character2Value = characterValueMap2[valueID]

        if(Math.abs(character1Value.score - character2Value.score) < COMMONNESS_THRESHOLD) {
          commonValues.push([character1Value, character2Value])
        }
      }

      commonValues.sort((a, b) => {
        let value1 = a[0]
        let value2 = b[0]
        return value2.score - value1.score
      })

      for(let commonValue of commonValues) {
        let character1Value = commonValue[0]
        let character2Value = commonValue[1]

        let valueContainer = document.createElement("div")
        valueContainer.classList.add("common-ground-view-container")

        let name = document.createElement("div")
        name.classList.add("common-ground-view-name")
        name.innerHTML = this.valuesMap[character1Value.valueID].name
        valueContainer.appendChild(name)

        let character1Container = document.createElement("div")
        character1Container.classList.add("common-ground-view-character-container")
        character1Container.innerHTML = `${this.selectedCharacters[0].name}: ${character1Value.score}`
        valueContainer.appendChild(character1Container)
        
        let character2Container = document.createElement("div")
        character2Container.classList.add("common-ground-view-character-container")
        character2Container.innerHTML = `${this.selectedCharacters[1].name}: ${character2Value.score}`
        valueContainer.appendChild(character2Container)

        valuesContainer.appendChild(valueContainer)
      }
    })
  }
}