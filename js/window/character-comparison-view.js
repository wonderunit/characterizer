const CharacterComparisonBaseView = require('./character-comparison-base-view.js')
const CharacterView = require('./character-selector-multiple.js')

module.exports = class CharacterComparisonView extends CharacterComparisonBaseView {
  constructor(properties) {
    super(properties)
    this.valuesViewType = "average"
    
    this.comparisonView = document.createElement("div")
    this.comparisonView.setAttribute("id", "character-comparison-view")
    this.root.appendChild(this.comparisonView)

    this.updateView()
  }

  updateView() {
    this.getSelectedCharacterValues()
    .then(characterValueResults => {
      if(!characterValueResults || !characterValueResults.length) {
        return
      }

      this.comparisonView.innerHTML = ``
      let comparisonView = document.createElement("div")
      comparisonView.setAttribute("id", "character-comparison-view")

      let targetWidth = 100/this.characters.length
      let index = 0
      
      for(let character of this.selectedCharacters) {
        let containerDiv = document.createElement("div")
        containerDiv.classList.add("comparison-character-view-container")
        containerDiv.setAttribute("style", `width: ${targetWidth}%;`)
        let nameContainer = document.createElement("h2")
        nameContainer.innerHTML = character.name
        containerDiv.appendChild(nameContainer)
        let curValuesView = this.getScoresView(character.id, characterValueResults[index])
        containerDiv.appendChild(curValuesView)
        comparisonView.appendChild(containerDiv)
        index++
      }

      this.root.replaceChild(comparisonView, this.comparisonView)
      this.comparisonView = comparisonView
    })
    
  }

  getScoresView(characterID, values) {
    let result = document.createElement('div')
    result.setAttribute("id", "values-view")

    for(let value of values) {
      let valueView = document.createElement('div')
      valueView.setAttribute("class", "value-list-name")

      let favButton = document.createElement('div')
      favButton.setAttribute("style", "position: relative; z-index: 2; padding-top: 10px;")
      favButton.innerHTML = `add favorite`
      if(this.charactersValueFavorites[characterID] && this.charactersValueFavorites[characterID][value.id]) {
        favButton.innerHTML = `favorited`
      } else {
        var self = this
        favButton.addEventListener('mouseup', function(event) {
          event.target.innerHTML = `favorited`
          self.emit('add-character-value-favorite', {valueID: value.id, characterID: characterID})
        })
      }

      let progressView = document.createElement('div')
      progressView.setAttribute("class", "value-list-progress")
      progressView.setAttribute("style", `width: ${value.score*100}%`)
      valueView.appendChild(progressView)
      let nameView = document.createElement('div')
      nameView.setAttribute("class", "value-list-label")
      nameView.innerHTML = `${this.valuesMap[value.valueID.toString()].name} | ${value.score} | Wins: ${value.wins}, Losses: ${value.losses} | Battles: ${value.battleCount}`
      valueView.appendChild(nameView)
      valueView.appendChild(favButton)
      result.appendChild(valueView)
    }

    return result
  }

  
}