const MainBaseView = require('./main-base-view.js')
const CharacterView = require('./character-view.js')

module.exports = class CharacterComparisonConflictView extends MainBaseView {
  constructor(properties) {
    super(properties)
    this.root = document.createElement("div")

    this.selectedCharacters = []
    this.valuesViewType = "average"

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
    this.comparisonView.setAttribute("id", "character-comparison-view")
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
      .then(characterValueResults => {
        this.comparisonView.innerHTML = ``
        let index = 0
        let container = document.createElement("div")
        let headersContainer = document.createElement("div")
        headersContainer.classList.add("comparison-view-conflicts-header-container")
        container.appendChild(headersContainer)
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
        for(let i = 0; i < 30; i++) {

          let conflictContainer = document.createElement("div")
          conflictContainer.classList.add("comparison-view-conflict-container")
          for(var j = 0; j < characterValueResults.length; j++) {
            if(j > 0) {
              let vsView = document.createElement("div")
              vsView.innerHTML = `vs`
              conflictContainer.appendChild(vsView)
            }
            let characterValues = characterValueResults[j]
            let value = characterValues[i]
            let name = this.valuesMap[value.valueID].name
            let nameView = document.createElement("div")
            nameView.innerHTML = name
            conflictContainer.appendChild(nameView)
          }
          container.appendChild(conflictContainer)
        }
        this.comparisonView.appendChild(container)
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