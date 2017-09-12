const MainBaseView = require('./main-base-view.js')

module.exports = class CharacterView extends MainBaseView {
  constructor(properties) {
    super(properties)

    this.valuesMap = properties.valuesMap

    this.root = document.createElement('div')
    this.root.setAttribute("id", "characters-container")
    let header = document.createElement("h2")
    header.innerHTML = `Characters`
    this.root.appendChild(header)
    this.characterInputContainer = document.createElement("div")
    this.characterInputContainer.setAttribute("id", "character-input-container")
    this.root.appendChild(this.characterInputContainer)
    this.characterInput = document.createElement("input")
    this.characterInput.setAttribute("id", "input-add-character-name")
    this.characterInput.setAttribute("type", "text")
    this.characterInput.addEventListener('keydown', (event)=>{
      if(event.keyCode === 13) {
        this.addCharacterFronInput()
      }
    })
    this.characterInputContainer.appendChild(this.characterInput)
    this.characterInputAddButton = document.createElement("div")
    this.characterInputAddButton.setAttribute("id", "character-input-add-button")
    this.characterInputAddButton.innerHTML = `Add Character`
    this.characterInputAddButton.addEventListener('click', this.addCharacterFronInput.bind(this))
    this.characterInputContainer.appendChild(this.characterInputAddButton)

    this.characterList = document.createElement("div")
    this.characterList.setAttribute("id", "character-list")
    this.root.appendChild(this.characterList)
    
    this.characters = []
    this.getCharacters().then(inValues => {
      this.characters = inValues
      this.updateView()
    })
  }

  addCharacterView(characterName, characterID) {
    let characterView = document.createElement('div')
    characterView.classList.add("button")
    characterView.setAttribute("data-id", characterID || 1)
    characterView.innerHTML = characterName
    characterView.addEventListener('click', this.onSelectCharacter.bind(this));
    this.characterList.appendChild(characterView)
  }

  addCharacterFronInput(event) {
    let newNameInput = document.querySelector("#input-add-character-name")
    let newName = newNameInput.value
    this.addCharacterView(newName, 13371337)
    if(newName) {
      this.emit('add-character', {name: newName})
      newNameInput.value = ""
    }
  }
  
  onSelectCharacter(event) {
    this.emit('select-character', {characterID: parseInt(event.target.dataset.id)})
  }

  getView() {
    return this.root
  }

  updateView() {
    this.characterList.innerHTML = ''
    for(let character of this.characters) {
      this.addCharacterView(character.name, character.id)
    }
  }
}