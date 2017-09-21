const MainBaseView = require('./main-base-view.js')
const ValuesViewAverage = require('./values-views/values-view-average.js')

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
        this.updateView()
        if(this.characters && this.characters.length) {
          this.onSelectCharacter(this.characters[0].id)
        }
      })
      .catch(console.error)
  }

  updateView() {

    // TODO: move this to completion of characters fetch.
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

    // TODO: move this to updateView, see internal-conflict-view
    if(!character) {
      return
    }

    this.valuesViewContainer.innerHTML = ``

    this.getCharacterValues(characterID).then(characterValues => {
      this.valuesView = new ValuesViewAverage({values: characterValues, valuesMap: this.valuesMap})
      this.valuesViewContainer.appendChild(this.valuesView.getView())
    })
  }

}