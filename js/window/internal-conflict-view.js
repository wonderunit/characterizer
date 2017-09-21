const MainBaseView = require('./main-base-view.js')
const { semiRandomShuffle } = require('../utils.js')
const NUM_COMPARISON_ITEMS = 60
const RANDOM_SHUFFLE_FACTOR = 4

module.exports = class InternalConflictView extends MainBaseView {
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

    this.comparisonView = document.createElement("div")
    this.comparisonView.setAttribute("id", "conflict-comparison-view")
    this.valuesViewContainer.appendChild(this.comparisonView)
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
    if(!this.character) {
      return
    }
    this.comparisonView.innerHTML = ``
    
    this.getCharacterValues(this.currentCharacterID).then(inCharacterValues => {
      let valuesCopy = inCharacterValues.slice(0, NUM_COMPARISON_ITEMS)
      let values = semiRandomShuffle(valuesCopy, RANDOM_SHUFFLE_FACTOR)

      this.comparisonView.innerHTML = ``

      let getValueView = (value)=>{
        let name = this.valuesMap[value.valueID].name
        let nameView = document.createElement("div")
        nameView.innerHTML = name
        return nameView
      }

      for(let i = 0; i<values.length; i+=2) {
        let value1 = values[i]
        let value2 = values[i+1]

        let conflictContainer = document.createElement("div")
        conflictContainer.classList.add("comparison-view-conflict-container")

        let nameView1 = getValueView(value1)
        conflictContainer.appendChild(nameView1)

        let vsView = document.createElement("div")
        vsView.innerHTML = `vs`
        conflictContainer.appendChild(vsView)

        let nameView2 = getValueView(value2)
        conflictContainer.appendChild(nameView2)
        this.comparisonView.appendChild(conflictContainer)
      }
    })
  }

  onSelectCharacter(characterID) {
    this.currentCharacterID = characterID
    for(let aCharacter of this.characters) { 
      if(aCharacter.id === this.currentCharacterID) {
        this.character = aCharacter
        break
      }
    }
    this.updateView()
  }
}