const MainBaseView = require('./main-base-view.js')
const FavoriteButton = require('./favorite-button.js')

module.exports = class ValueListView extends MainBaseView {
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

    this.valuesViewContainer = document.createElement("div")
    this.valuesViewContainer.setAttribute("id", "values-view-container")
    this.root.appendChild(this.valuesViewContainer)

    this.characters = []
    this.getCharacters()
      .then(inCharacters => {
        this.characters = inCharacters

        let selectedCharacter
        let selectedCharacters = this.getSelectedCharacters()
        if(selectedCharacters && selectedCharacters.length) {
          selectedCharacter = selectedCharacters[0]
        } else if(this.characters && this.characters.length) {
          selectedCharacter = this.characters[0]
        }

        this.characterSelector.innerHTML = ``
        for(let character of this.characters) {

          let option = document.createElement("option")
          option.setAttribute("value", character.id)
          option.innerHTML = character.name
          this.characterSelector.appendChild(option)
          if(selectedCharacter && selectedCharacter.id === character.id) {
            option.setAttribute("selected", true)
          }
        }
        this.onSelectCharacter(selectedCharacter.id)
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
          valueView.classList.add("value-list-container")
    
          let favButtonProperties = {
            checked: isFavorite,
            enabled: !isFavorite,
            className: "favorite-button-container-value-list-view"
          }

          var self = this
          let favButton = new FavoriteButton(favButtonProperties)
          favButton.setHandler(function(event) {
            self.emit('add-character-value-favorite', {valueID: value.valueID, characterID: self.currentCharacterID})
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
        .catch(console.error)
    }
    return result
  }

}