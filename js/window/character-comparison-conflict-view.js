const MainBaseView = require('./main-base-view.js')
const CharacterView = require('./character-view.js')
const { semiRandomShuffle } = require('../utils.js')
const NUM_COMPARISON_ITEMS = 30
const RANDOM_SHUFFLE_FACTOR = 4

module.exports = class CharacterComparisonConflictView extends MainBaseView {
  constructor(properties) {
    super(properties)
    this.root = document.createElement("div")

    this.selectedCharacters = []
    this.valuesViewType = "table"

    this.root = document.createElement("div")
    this.root.setAttribute("id", "character-comparison-container")
    
    this.characterView = new CharacterView(properties)
    this.root.appendChild(this.characterView.getView())
    this.getCharacters()
      .then(inCharacters => {
        this.characters = inCharacters
        this.characterView.on('select-character', data => {
          this.onSelectCharacter(data.characterID)
        })
        this.characterView.on('add-character', data => {
          this.emit('add-character', data)
        })
        this.characterView.updateView()
      })
      .catch(console.error)
    
    this.comparisonView = document.createElement("div")
    this.comparisonView.setAttribute("id", "conflict-comparison-view")
    this.root.appendChild(this.comparisonView)
  }

  onSelectCharacter(characterID) {
    let start = Date.now()
    let isExisting = false
    for(let i = 0; i<this.selectedCharacters.length; i++) {
      let curCharacterID = this.selectedCharacters[i]
      if(curCharacterID === characterID) {
        this.selectedCharacters.splice(i, 1)
        isExisting = true
        break
      }
    }
    if(!isExisting) {
      this.selectedCharacters.push(characterID)
    }
    if(this.selectedCharacters.length > 1) {
      this.updateView()
    }
  }

  updateView() {
    let characterValuePromises = []
    let selectedCharacters = []
    for(let aCharacterID of this.selectedCharacters) {
      for(let aCharacter of this.characters) { 
        if(aCharacter.id === aCharacterID) {
          selectedCharacters.push({
            "character": aCharacter
          })
          break
        }
      }
      characterValuePromises.push(this.getCharacterValues(aCharacterID))
    }

    Promise.all(characterValuePromises)
      .then(inCharacterValueResults => {
        let characterValueResults = []
        for(let i = 0; i < inCharacterValueResults.length; i++) {
          let values = inCharacterValueResults[i].slice(0, NUM_COMPARISON_ITEMS)
          characterValueResults.push(semiRandomShuffle(values, RANDOM_SHUFFLE_FACTOR))
        }

        this.comparisonView.innerHTML = ``
        let headersContainer = document.createElement("div")
        headersContainer.classList.add("comparison-view-conflicts-header-container")
        this.comparisonView.appendChild(headersContainer)

        let container = document.createElement("div")
        container.classList.add("comparison-view-conflicts-values-container")
        for(let i = 0; i<selectedCharacters.length; i++) {
          if(i > 0) {
            let vsView = document.createElement("div")
            vsView.innerHTML = `vs`
            headersContainer.appendChild(vsView)
          }
          let characterName = document.createElement("h2")
          characterName.classList.add("comparison-view-conflicts-header")
          characterName.innerHTML = selectedCharacters[i].character.name
          headersContainer.appendChild(characterName)
        }

        for(let i = 0; i < NUM_COMPARISON_ITEMS; i++) {
          let conflictContainer = this.getValuesView(i, characterValueResults, selectedCharacters)
          conflictContainer.style.left = `${i/NUM_COMPARISON_ITEMS*100}%`
          container.appendChild(conflictContainer)
        }
        this.comparisonView.appendChild(container)
      })
      .catch(console.error)
  }

  getValuesView(valueIndex, characterValueResults, selectedCharacters) {
    switch(this.valuesViewType) {
      case "graph":
        return this.getGraphView(valueIndex, characterValueResults, selectedCharacters)
      case "table":
      default:
        return this.getTableView(valueIndex, characterValueResults, selectedCharacters)
    }
  }

  getTableView(valueIndex, characterValueResults, selectedCharacters) {
    let conflictContainer = document.createElement("div")
    conflictContainer.classList.add("comparison-view-conflict-container")
    for(var j = 0; j < characterValueResults.length; j++) {
      if(j > 0) {
        let vsView = document.createElement("div")
        vsView.innerHTML = `vs`
        conflictContainer.appendChild(vsView)
      }
      let characterValues = characterValueResults[j]
      let value = characterValues[valueIndex]
      let name = this.valuesMap[value.valueID].name
      let nameView = document.createElement("div")
      nameView.innerHTML = name
      conflictContainer.appendChild(nameView)
    }
    return conflictContainer
  }
  
  getGraphView(valueIndex, characterValueResults, selectedCharacters) {
    let conflictContainer = document.createElement("div")
    conflictContainer.classList.add("comparison-view-conflict-container-graph")
    let dotView = document.createElement("div")
    dotView.classList.add("comparison-view-conflict-container-graph-dot")
    conflictContainer.appendChild(dotView)
    let namesView = document.createElement("div")
    namesView.classList.add("comparison-view-conflict-container-graph-names")
    namesView.classList.add("hidden")
    conflictContainer.appendChild(namesView)
    let valueCumulateive = 0
    for(var j = 0; j < characterValueResults.length; j++) {
      if(j > 0) {
        let vsView = document.createElement("div")
        vsView.innerHTML = `vs`
        namesView.appendChild(vsView)
      }
      let characterValues = characterValueResults[j]
      let value = characterValues[valueIndex]
      let name = this.valuesMap[value.valueID].name
      let nameView = document.createElement("div")
      nameView.classList.add("comparison-view-conflict-container-graph-name")
      nameView.innerHTML = name
      namesView.appendChild(nameView)

      valueCumulateive += value.score
    }
    conflictContainer.style.bottom = `${(valueCumulateive/characterValueResults.length)*100}%`
    conflictContainer.addEventListener("mouseenter", function(event){
      namesView.classList.remove("hidden")
    })
    conflictContainer.addEventListener("mouseleave", function(event){
      namesView.classList.add("hidden")
    })
    return conflictContainer
  }
}

