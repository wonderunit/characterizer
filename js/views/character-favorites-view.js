const MainBaseView = require('./main-base-view.js')

module.exports = class CharacterFavoritesView extends MainBaseView {
  constructor(properties) {
    super(properties)
    
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

    var selectedCharacters = this.getSelectedCharacters()
    if(selectedCharacters && selectedCharacters.length > 0) {
      this.currentCharacterID = selectedCharacters[0].id
    }

    this.characters = []
    this.getCharacters()
      .then(inCharacters => {
        this.characters = inCharacters

        if(!this.currentCharacterID && this.characters && this.characters.length) {
          this.currentCharacterID = this.characters[0].id
        }

        this.characterSelector.innerHTML = ``
        for(let character of this.characters) {
          let option = document.createElement("option")
          option.setAttribute("value", character.id)
          if(character.id == this.currentCharacterID) {
            option.setAttribute("selected", true)
          }
          option.innerHTML = character.name
          this.characterSelector.appendChild(option)
        }
        
        this.onSelectCharacter(this.currentCharacterID)
      })
      .catch(console.error)
  }

  updateView() {
    
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

    this.getCharacterValueFavorites(characterID).then(characterBattleFavorites => {
      if(!characterBattleFavorites) {
        return
      }
      this.valuesViewContainer.innerHTML = ``

      let values = characterBattleFavorites.values
      let favoriteValuesHolder = document.createElement("div")
      favoriteValuesHolder.setAttribute("id", "favorite-values-holder")
      let valueNames = []
      for(let valueID of values) {
        let value = this.valuesMap[valueID]
        if(value && value.name) {
          valueNames.push(value.name)
        }
      }
      valueNames = valueNames.sort()
      for(let valueName of valueNames) {
        let view = document.createElement("div")
        view.innerHTML = `<b>${valueName}</b>`
        favoriteValuesHolder.appendChild(view)
      }
      this.valuesViewContainer.appendChild(favoriteValuesHolder)

      let pairs = characterBattleFavorites.pairs
      let pairsHolder = document.createElement("div")
      pairsHolder.setAttribute("id", "favorite-pairs-holder")
      for(var value1ID in pairs) {
        let value1 = this.valuesMap[value1ID]
        for(var value2ID in pairs[value1ID]) {
          let value2 = this.valuesMap[value2ID]
          let view = document.createElement("div")
          view.innerHTML = `<b>${value1.name}</b> <i>vs</i> <b>${value2.name}</b>`
          pairsHolder.appendChild(view)
        }
      }
      this.valuesViewContainer.appendChild(pairsHolder)
    })

    this.emit('selected-characters', [character])
  }

}