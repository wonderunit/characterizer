const MainBaseView = require('./main-base-view.js')

module.exports = class BattleFavoritesView extends MainBaseView {
  constructor(properties) {
    super(properties)
    
    this.root = document.createElement("div")
    this.root.setAttribute("id", "value-list-container")

    this.characterSelector = document.createElement("select")
    this.characterSelector.setAttribute("id", "character-selector")
    this.characterSelector.addEventListener('change', (event)=>{
      this.currentCharacterID = parseInt(event.target.value)
      this.onSelectCharacter(this.currentCharacterID)
    })
    this.root.appendChild(this.characterSelector)

    this.valuesViewContainer = document.createElement("div")
    this.valuesViewContainer.setAttribute("id", "values-view-container")
    this.root.appendChild(this.valuesViewContainer)

    this.characters = []
    this.getCharacters()
      .then(inCharacters => {
        this.characters = inCharacters
        this.updateView()
        if(this.characters && this.characters.length) {
          this.onSelectCharacter(this.characters[0].id)
        }
      })
      .catch(console.error)
  }

  updateView() {
    this.characterSelector.innerHTML = ``
    for(let character of this.characters) {
      let option = document.createElement("option")
      option.setAttribute("value", character.id)
      option.innerHTML = character.name
      this.characterSelector.appendChild(option)
    }
  }

  onSelectCharacter(characterID) {
    this.currentCharacterID = characterID
    let character
    for(let aCharacter of this.characters) { 
      if(aCharacter.id === this.currentCharacterID) {
        character = aCharacter
        break
      }
    }

    if(!character) {
      return
    }

    this.valuesViewContainer.innerHTML = ``

    this.getCharacterBattleFavorites(characterID).then(characterBattleFavorites => {
      if(!characterBattleFavorites) {
        return
      }
      this.valuesViewContainer.innerHTML = ``
      for(var value1ID in characterBattleFavorites) {
        let value1 = this.valuesMap[value1ID]
        for(var value2ID in characterBattleFavorites[value1ID]) {
          let value2 = this.valuesMap[value2ID]
          let view = document.createElement("div")
          view.innerHTML = `<b>${value1.name}</b> <i>vs</i> <b>${value2.name}</b>`
          this.valuesViewContainer.appendChild(view)
        }
      }
    })
  }

}