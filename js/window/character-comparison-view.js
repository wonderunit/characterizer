const MainBaseView = require('./main-base-view.js')
const CharacterView = require('./character-view.js')
const CharacterComparisonAverageView = require('./character-comparison-average-view.js')

module.exports = class CharacterComparisonView extends MainBaseView {
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
    this.updateView()
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
        for(let characterValues of characterValueResults) {
          selectedCharacters[index].values = characterValues
          index++
        }
        let ValuesView = this.getValuesView()
        let properties = { 
          valuesMap: this.valuesMap, 
          characters: selectedCharacters
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