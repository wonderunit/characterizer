const CharacterComparisonBaseView = require('./character-comparison-base-view.js')
const CharacterView = require('./character-selector-multiple.js')
const FavoriteButton = require('./favorite-button.js')

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
        valueView.setAttribute("class", "value-list-container")
  

        let favoriteValues = characterValueFavorites.values
        let isFavorite = favoriteValues.indexOf(value.valueID) >= 0
        let favButtonProperties = {
          checked: isFavorite,
          enabled: !isFavorite,
          className: "favorite-button-container-value-list-view"
        }

        var self = this
        let favButton = new FavoriteButton(favButtonProperties)
        favButton.setHandler(function(event) {
          self.emit('add-character-value-favorite', {valueID: value.valueID, characterID: characterID})
          favButton.setChecked(true)
          favButton.setEnabled(false)
        })
        valueView.appendChild(favButton.getView())

        let progressView = document.createElement('div')
        progressView.setAttribute("class", "value-list-progress")
        progressView.setAttribute("style", `width: ${value.score*100}%`)
        valueView.appendChild(progressView)
        let nameView = document.createElement('div')
        nameView.setAttribute("class", "value-list-label")
        nameView.innerHTML = `${this.valuesMap[value.valueID.toString()].name} | ${value.score} | Wins: ${value.wins}, Losses: ${value.losses} | Battles: ${value.battleCount}`
        valueView.appendChild(nameView)

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