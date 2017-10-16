const MainBaseView = require('./main-base-view.js')

module.exports = class CharactersView extends MainBaseView {
  constructor(properties) {
    super(properties)
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
    this.characterList.classList.add("flex-wrap")
    this.root.appendChild(this.characterList)
    
    this.characters = []
    this.getCharacters().then(inValues => {
      this.characters = inValues
      this.updateView()
    })
  }
  
  addCharacterView(character, isSelected) {
    let self = this
    let characterName = character.name
    let characterID = character.id

    let characterView = document.createElement('div')
    characterView.classList.add("manage-character-container")
    characterView.setAttribute("data-id", characterID || 1)

    let nameView = document.createElement("div")
    nameView.innerHTML = characterName
    characterView.appendChild(nameView)

    let battleCountView = document.createElement("div")
    battleCountView.innerHTML = `${this.getCharacterBattleCount(characterID)} Battles`
    characterView.appendChild(battleCountView)

    let trainButton = document.createElement("div")
    trainButton.classList.add("manage-character-button")
    trainButton.innerHTML = "Train"
    trainButton.addEventListener("click", function(event) {
      self.emit("train", [character])
    })
    characterView.appendChild(trainButton)
    
    let viewValuesButton = document.createElement("div")
    viewValuesButton.classList.add("manage-character-button")
    viewValuesButton.innerHTML = "Values"
    viewValuesButton.addEventListener("click", function(event) {
      self.emit("viewValues", [character])
    })
    characterView.appendChild(viewValuesButton)

    characterView.addEventListener('click', this.onCharacterClick.bind(this));
    this.characterList.appendChild(characterView)
  }
  
  addCharacterFronInput(event) {
    let newNameInput = document.querySelector("#input-add-character-name")
    let newName = newNameInput.value
    this.addCharacterView({name: newName}, 13371337)
    if(newName) {
      this.emit('add-character', {name: newName})
      newNameInput.value = ""
    }
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
      this.addCharacterView(character, isSelected)
    }
  }
}