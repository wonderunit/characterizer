const CharacterComparisonBaseView = require('./character-comparison-base-view.js')
const CharacterView = require('./character-selector-multiple.js')

module.exports = class CharacterComparisonView extends CharacterComparisonBaseView {
  constructor(properties) {
    super(properties)
    this.valuesViewType = "average"

    this.isFiltering = false
    this.favoritesFilter = document.createElement("div")
    this.favoritesFilter.classList.add("favorites-filter-button")
    this.favoritesFilter.innerHTML = `Show Favorites`
    this.favoritesFilter.addEventListener("click", (event) => {
      this.isFiltering = !this.isFiltering
      if(this.isFiltering) {
        this.favoritesFilter.innerHTML = `Show All`
      } else {
        this.favoritesFilter.innerHTML = `Show Favorites`
      }
      this.updateView()
    })
    this.root.appendChild(this.favoritesFilter)
    
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
      
      for(let characterValueResult of characterValueResults) {
        let character = this.selectedCharacters[index]
        let containerDiv = document.createElement("div")
        containerDiv.classList.add("comparison-character-view-container")
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
    if(!values) {
      throw new Error("missing values")
    }
    let result = document.createElement('div')
    result.setAttribute("id", "values-view")

    for(let value of values) {
      this.getCharacterValueFavorites(characterID).then(characterValueFavorites => {
        let valueView = document.createElement('div')
        valueView.setAttribute("class", "value-list-name")
  
        let favButton = document.createElement('div')
        favButton.setAttribute("style", "position: relative; z-index: 2; padding-top: 10px;")
        favButton.innerHTML = `add favorite`

        let favoriteValues = characterValueFavorites.values
        let isFavorite = favoriteValues.indexOf(value.valueID) >= 0
        if(isFavorite) {
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

        if(this.isFiltering && isFavorite) {
          result.appendChild(valueView)
        } else if(!this.isFiltering) {
          result.appendChild(valueView)
        }

      })

    }

    return result
  }

  
}