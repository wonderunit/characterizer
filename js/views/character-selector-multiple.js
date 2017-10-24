const MainBaseView = require('./main-base-view.js')

module.exports = class CharacterView extends MainBaseView {
  constructor(properties) {
    super(properties)

    this.root = document.createElement('div')
    this.root.setAttribute("id", "characters-container")

    this.characterList = document.createElement("div")
    this.characterList.setAttribute("id", "character-list")
    this.characterList.classList.add("flex-wrap")
    this.root.appendChild(this.characterList)
    
    this.characters = []
    this.getCharacters().then(inValues => {
      this.characters = inValues
      this.updateView()
    })
  }

  addCharacterView(characterName, characterID, isSelected) {
    let characterView = document.createElement('div')
    characterView.classList.add("character-selector-button")
    if(isSelected) {
      characterView.classList.add("character-selector-button-selected")
    }
    characterView.setAttribute("data-id", characterID || 1)
    characterView.innerHTML = characterName
    characterView.addEventListener('click', this.onCharacterClick.bind(this));
    this.characterList.appendChild(characterView)
  }
  
  onCharacterClick(event) {
    this.emit('select-character', {characterID: parseInt(event.target.dataset.id)})
  }

  getView() {
    return this.root
  }

  updateView() {
    let selectedCharacters = this.getSelectedCharacters()
    this.characterList.innerHTML = ''
    for(let character of this.characters) {
      let isSelected = false
      for(let selectedCharacter of selectedCharacters) {
        if(selectedCharacter.id === character.id) {
          isSelected = true
          break
        }
      }
      this.addCharacterView(character.name, character.id, isSelected)
    }
  }
}