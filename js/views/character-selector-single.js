const MainBaseView = require('./main-base-view.js')

module.exports = class CharacterSelectorSingle extends MainBaseView {
  constructor(properties) {
    super(properties)
    this.characters = []
    this.root = document.createElement("select")
    this.root.setAttribute("id", "character-selector")
    this.root.addEventListener('change', (event)=>{
      this.emit('change', event)
    })
  }
  
  init() {
    this.getCharacters()
      .then(inCharacters => {
        this.root.innerHTML = ``
        if(!inCharacters || !inCharacters.length) {
          return
        }
        
        this.character = inCharacters[0]
        this.characters = inCharacters
        for(let character of inCharacters) {
          this.addCharacterView(character.name, character.id, this.character.id === character.id)
        }
      })
      .catch(console.error)
  }

  addCharacterView(characterName, characterID, isSelected) {
    let option = document.createElement("option")
    option.setAttribute("value", characterID)
    option.innerHTML = characterName
    if(isSelected) {
      option.setAttribute("selected", true)
    }
    this.root.appendChild(option)
  }

  getView() {
    return this.root
  }

  updateView() {
    this.root = ``
    let selectedCharacters = this.getSelectedCharacters()
    this.characterList.innerHTML = ''
    let isSelected = false
    for(let character of this.characters) {
      if(!isSelected) {
        for(let selectedCharacter of selectedCharacters) {
          if(selectedCharacter.id === character.id) {
            isSelected = true
            break
          }
        }
      }
      this.addCharacterView(character.name, character.id, isSelected)
    }
  }

}