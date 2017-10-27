const utils = require('../utils.js')
const CharacterComparisonBaseView = require('./character-comparison-base-view.js')
const COMMONNESS_THRESHOLD = .10

module.exports = class CommonGroundView extends CharacterComparisonBaseView {
  constructor(properties) {
    super(properties)
    this.viewType = "all"

    this.viewTypeSelector = document.createElement("select")
    this.viewTypeSelector.classList.add("comparison-view-selector")
    for(let type of ["all", "favorites"]) {
      let option = document.createElement("option")
      option.setAttribute("value", type)
      option.innerHTML = type
      this.viewTypeSelector.appendChild(option)
    }
    this.viewTypeSelector.addEventListener('change', (event)=>{
      this.viewType = event.target.value
      this.updateView()
    })
    this.root.appendChild(this.viewTypeSelector)

    this.comparisonView = document.createElement("div")
    this.comparisonView.classList.add("comparison-view")
    this.root.appendChild(this.comparisonView)
    this.updateView()
  }

  updateView() {
    this.comparisonView.innerHTML = ``
    let headersContainer = document.createElement("div")
    headersContainer.classList.add("comparison-view-conflicts-header-container")
    this.comparisonView.appendChild(headersContainer)

    for(let i = 0; i<this.selectedCharacters.length; i++) {
      if(i > 0) {
        let vsView = document.createElement("div")
        vsView.innerHTML = `and`
        headersContainer.appendChild(vsView)
      }
      let characterName = document.createElement("h2")
      characterName.classList.add("comparison-view-conflicts-header")
      characterName.innerHTML = this.selectedCharacters[i].name
      headersContainer.appendChild(characterName)
    }

    if(this.selectedCharacters.length < 2) {
      let selectView = document.createElement("div")
      selectView.innerHTML = `Please select two characters to show their common ground.`
      this.comparisonView.appendChild(selectView)
      return
    }

    let valuesContainer
    switch(this.viewType) {
      case "favorites":
        valuesContainer = this.getFavoriteValuesView() 
        break
      case "all":
      default:
        valuesContainer = this.getAllValuesView()
        break
    }

    this.comparisonView.appendChild(valuesContainer)
  }

  getAllValuesView() {
    let valuesContainer = document.createElement("div")

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

        if(Math.abs(character1Value.score - character2Value.score) < COMMONNESS_THRESHOLD
            && character1Value.score > 0 && character2Value.score > 0) {

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

        let scoresContainer = document.createElement("div")
        scoresContainer.classList.add("common-ground-view-scores")
        valueContainer.appendChild(scoresContainer)

        let character1Container = document.createElement("div")
        character1Container.classList.add("common-ground-view-character-container")
        character1Container.innerHTML = `${this.selectedCharacters[0].name}: ${character1Value.score}`
        scoresContainer.appendChild(character1Container)
        
        let character2Container = document.createElement("div")
        character2Container.classList.add("common-ground-view-character-container")
        character2Container.innerHTML = `${this.selectedCharacters[1].name}: ${character2Value.score}`
        scoresContainer.appendChild(character2Container)

        valuesContainer.appendChild(valueContainer)
      }
    })

    return valuesContainer
  }
  
  getFavoriteValuesView() {
    let valuesContainer = document.createElement("div")

    let character1ID = this.selectedCharacters[0].id
    let character2ID = this.selectedCharacters[1].id
    let favoritePairs = []
    Promise.all([
      this.getCharacterValueFavorites(character1ID),
      this.getCharacterValueFavorites(character2ID),
      this.getCharacterValuesMap(character1ID),
      this.getCharacterValuesMap(character2ID)
    ]).then(results => {
      let characterValueFavorites1 = results[0].values
      let characterValueFavorites2 = results[1].values
      let characterValueMap1 = results[2]
      let characterValueMap2 = results[3]

      let commonValues = []

      // combine favorites, and make unique
      let s = new Set(characterValueFavorites1.concat(characterValueFavorites2))
      let it = s.values()
      let favoriteValueIDs = Array.from(it)

      for(let valueID of favoriteValueIDs) {
        let character1Value = characterValueMap1[valueID]
        let character2Value = characterValueMap2[valueID]

        if(character1Value && character2Value 
            && Math.abs(character1Value.score - character2Value.score) < COMMONNESS_THRESHOLD
            && character1Value.score > 0 && character2Value.score > 0) {
              
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

        let scoresContainer = document.createElement("div")
        scoresContainer.classList.add("common-ground-view-scores")
        valueContainer.appendChild(scoresContainer)

        let character1Container = document.createElement("div")
        character1Container.classList.add("common-ground-view-character-container")
        character1Container.innerHTML = `${this.selectedCharacters[0].name}: ${character1Value.score}`
        scoresContainer.appendChild(character1Container)
        
        let character2Container = document.createElement("div")
        character2Container.classList.add("common-ground-view-character-container")
        character2Container.innerHTML = `${this.selectedCharacters[1].name}: ${character2Value.score}`
        scoresContainer.appendChild(character2Container)

        valuesContainer.appendChild(valueContainer)
      }
    })

    return valuesContainer
  }
}