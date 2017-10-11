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

    this.isFiltering = false
    this.favoritesFilter = document.createElement("div")
    this.favoritesFilter.setAttribute("id", "favorites-filter-button")
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
      this.getCharacterValueFavorites(this.currentCharacterID)
        .then(characterValueFavorites => {
          let favoriteValues = characterValueFavorites.values 
          let isFavorite = favoriteValues.indexOf(value.valueID) >= 0

          let valueView = document.createElement('div')
          valueView.setAttribute("class", "value-list-name")
    
          let favButton = document.createElement('div')
          favButton.innerHTML = `add favorite`

          if(isFavorite) {
            favButton.innerHTML = `favorited`
          } else {
            var self = this
            favButton.addEventListener('mouseup', function(event) {
              event.target.innerHTML = `favorited`
              self.emit('add-character-value-favorite', {valueID: value.valueID, characterID: self.currentCharacterID})
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
          if(this.isFiltering && isFavorite) {
            result.appendChild(favButton)
            result.appendChild(valueView)
          } else if(!this.isFiltering) {
            result.appendChild(favButton)
            result.appendChild(valueView)
          }
        })
        .catch(console.error)
    }
    return result
  }

}