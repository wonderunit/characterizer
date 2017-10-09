const MainBaseView = require('./main-base-view.js')

module.exports = class ValueListView extends MainBaseView {
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

        this.characterSelector.innerHTML = ``
        for(let character of this.characters) {
          let option = document.createElement("option")
          option.setAttribute("value", character.id)
          option.innerHTML = character.name
          this.characterSelector.appendChild(option)
        }

        if(this.characters && this.characters.length) {
          this.onSelectCharacter(this.characters[0].id)
        }
      })
      .catch(console.error)
  }

  updateView() {
    if(!this.currentCharacterID) {
      return
    }

    this.valuesViewContainer.innerHTML = ``

    this.getCharacterValues(this.currentCharacterID)
      .then(characterValues => {
        this.valuesView = this.getValuesView(characterValues)
        this.valuesViewContainer.appendChild(this.valuesView)
      })
      .catch(console.error)
  }

  onSelectCharacter(characterID) {
    this.currentCharacterID = characterID
    this.updateView()
  }

  getValuesView(values) {
    let result = document.createElement('div')
    result.setAttribute("id", "values-view")

    for(let value of values) {
      let valueView = document.createElement('div')
      valueView.setAttribute("class", "value-list-name")

      let favButton = document.createElement('div')
      favButton.innerHTML = `add favorite`
      if(this.charactersValueFavorites[this.currentCharacterID] && this.charactersValueFavorites[this.currentCharacterID][value.id]) {
        favButton.innerHTML = `favorited`
      } else {
        var self = this
        favButton.addEventListener('mouseup', function(event) {
          event.target.innerHTML = `favorited`
          self.emit('add-character-value-favorite', {valueID: value.id, characterID: self.currentCharacterID})
        })
      }
      result.appendChild(favButton)

      let progressView = document.createElement('div')
      progressView.setAttribute("class", "value-list-progress")
      progressView.setAttribute("style", `width: ${value.score*100}%`)
      valueView.appendChild(progressView)
      let nameView = document.createElement('div')
      nameView.setAttribute("class", "value-list-label")
      nameView.innerHTML = `${this.valuesMap[value.valueID.toString()].name} | ${value.score} | Wins: ${value.wins}, Losses: ${value.losses} | Battles: ${value.battleCount}`
      valueView.appendChild(nameView)
      result.appendChild(valueView)
    }
    return result
  }

}