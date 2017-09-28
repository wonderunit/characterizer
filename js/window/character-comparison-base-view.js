const MainBaseView = require('./main-base-view.js')
const CharacterView = require('./character-view.js')

module.exports = class CharacterComparisonBaseView extends MainBaseView {
  constructor(properties) {
    super(properties)
    this.selectedCharacters = this.selectedCharacters = this.getSelectedCharacters()
    this.valuesViewType = "table"

    this.root = document.createElement("div")
    this.root.setAttribute("id", "character-comparison-container")
    
    this.characterView = new CharacterView(properties)
    this.root.appendChild(this.characterView.getView())

    this.charactersMap = {}
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
        for(let character of inCharacters) {
          this.charactersMap[character.id] = character
        }
      })
      .catch(console.error)
  }

  onSelectCharacter(characterID) {
    let isExisting = false
    for(let i = 0; i<this.selectedCharacters.length; i++) {
      let curCharacter = this.selectedCharacters[i]
      if(curCharacter.id === characterID) {
        this.selectedCharacters.splice(i, 1)
        isExisting = true
        break
      }
    }

    if(!isExisting) {
      for(let aCharacter of this.characters) { 
        if(aCharacter.id === characterID) {
          this.selectedCharacters.push(aCharacter)
          break
        }
      }
    }

    this.emit('selected-characters', this.selectedCharacters)
    
    this.updateView()
  }

  getSelectedCharacterValues() {
    let characterValuePromises = []
    let selectedCharacters = []
    for(let aCharacter of this.selectedCharacters) {
      characterValuePromises.push(this.getCharacterValues(aCharacter.id))
    }

    return Promise.all(characterValuePromises)
  }

  updateView() {
    
  }
}

