const MainBaseView = require('./main-base-view.js')

module.exports = class CharactersView extends MainBaseView {
  constructor(properties) {
    super(properties)
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
  
  addCharacterView(character) {
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

  addInputCharacterView() {
    this.addCharacterViewContainer = document.createElement('div')
    this.addCharacterViewContainer.classList.add("manage-characters-add-container")
    this.addCharacterViewContainer.dataset.mode = "button"

    this.characterInput = document.createElement("input")
    this.characterInput.setAttribute("id", "input-add-character-name")
    this.characterInput.setAttribute("type", "text")
    this.characterInput.classList.add("hidden")
    this.characterInput.addEventListener('keydown', (event)=>{
      if(event.keyCode === 13) {
        this.addCharacterFronInput()
      }
    })
    this.addCharacterViewContainer.appendChild(this.characterInput)
    this.characterInputAddButton = document.createElement("div")
    this.characterInputAddButton.setAttribute("id", "character-input-add-button")
    this.characterInputAddButton.classList.add("hidden")
    this.characterInputAddButton.innerHTML = `Add`
    this.characterInputAddButton.addEventListener('click', this.addCharacterFronInput.bind(this))
    this.addCharacterViewContainer.appendChild(this.characterInputAddButton)

    // plus biew
    let plusContainer = document.createElement("div")
    plusContainer.classList.add("manage-characters-add-button-image-container")
    this.addCharacterViewContainer.appendChild(plusContainer)

    let plus = document.createElement("img")
    plus.setAttribute("src", "images/add-character-plus.svg")
    plus.classList.add("manage-characters-add-button-image")
    plusContainer.appendChild(plus)

    this.addCharacterViewContainer.addEventListener('click', (event)=>{
      if(this.addCharacterViewContainer.dataset.mode === "button") {
        this.characterInput.classList.remove("hidden")
        this.characterInput.focus()
        this.characterInputAddButton.classList.remove("hidden")
        plus.classList.add("hidden")
        this.addCharacterViewContainer.dataset.mode = "input"
      } else {
        this.characterInput.classList.add("hidden")
        this.characterInputAddButton.classList.add("hidden")
        plus.classList.remove("hidden")
        this.addCharacterViewContainer.dataset.mode = "button"
      }

    });

    this.characterList.appendChild(this.addCharacterViewContainer)
  }
  
  addCharacterFronInput(event) {
    this.characterList.removeChild(this.addCharacterViewContainer)
    let newName = this.characterInput.value
    this.addCharacterView({name: newName}, 13371337)
    if(newName) {
      this.emit('add-character', {name: newName})
    }
    this.addInputCharacterView()
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
      this.addCharacterView(character)
    }

    this.addInputCharacterView()
  }
}