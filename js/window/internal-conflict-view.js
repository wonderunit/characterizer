const utils = require('../utils.js')
const MainBaseView = require('./main-base-view.js')
const { semiRandomShuffle } = require('../utils.js')
const NUM_COMPARISON_ITEMS = 60
const RANDOM_SHUFFLE_FACTOR = 4

module.exports = class InternalConflictView extends MainBaseView {
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

    this.comparisonView = document.createElement("div")
    this.comparisonView.classList.add("comparison-view")
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

    if(this.isFiltering) {
      this.getFavoriteValuesView()
    } else {
      this.getAllValuesView()
    }
  }

  getComparisonView(value1, value2) {
    let conflictContainer = document.createElement("div")
    conflictContainer.classList.add("comparison-view-conflict-container")

    let favButton = document.createElement('div')
    favButton.innerHTML = `add favorite`
    conflictContainer.appendChild(favButton)
    let favoriteData = {}
    favoriteData[`character1ID`] = value1.characterID
    favoriteData[`value1ID`] = value1.valueID
    favoriteData[`character2ID`] = value2.characterID
    favoriteData[`value2ID`] = value2.valueID
    let isFavorite = utils.checkObjectPath([value1.characterID, value1.valueID, value2.characterID, value2.valueID], this.valueComparisonFavorites) 
          || utils.checkObjectPath([value2.characterID, value2.valueID, value1.characterID, value1.valueID], this.valueComparisonFavorites)
    if(isFavorite) {
      favButton.innerHTML = `favorited`
    } else {
      var self = this
      favButton.addEventListener('mouseup', function(event) {
        event.target.innerHTML = `favorited`
        self.emit('add-comparison-favorite', favoriteData)
      })
    }

    let getValueView = (value)=>{
      let name = this.valuesMap[value.valueID].name
      let nameView = document.createElement("div")
      nameView.innerHTML = name
      return nameView
    }

    let nameView1 = getValueView(value1)
    conflictContainer.appendChild(nameView1)

    let vsView = document.createElement("div")
    vsView.innerHTML = `vs`
    conflictContainer.appendChild(vsView)

    let nameView2 = getValueView(value2)
    conflictContainer.appendChild(nameView2)
    this.comparisonView.appendChild(conflictContainer)
  }

  getFavoriteValuesView() {

    let values = []

    
    
    if(this.valueComparisonFavorites[this.currentCharacterID]) {
      this.getCharacterValuesMap(this.currentCharacterID)
        .then(characterValueMap => {
          for(let key in this.valueComparisonFavorites[this.currentCharacterID]) {
            if(this.valueComparisonFavorites[this.currentCharacterID][key][this.currentCharacterID]) {
              let key2
              for(let value2ID in this.valueComparisonFavorites[this.currentCharacterID][key][this.currentCharacterID]) {
                key2 = value2ID
                break
              }
              let value1 = characterValueMap[key]
              let value2 = characterValueMap[key2]
              this.getComparisonView(value1, value2)
            }
          }
        })
        .catch(console.error)
    }

    let getValueView = (value)=>{
      let name = this.valuesMap[value.valueID].name
      let nameView = document.createElement("div")
      nameView.innerHTML = name
      return nameView
    }
  }
  
  getAllValuesView() {
    
    this.getCharacterValues(this.currentCharacterID).then(inCharacterValues => {
      let valuesCopy = inCharacterValues.slice(0, NUM_COMPARISON_ITEMS)
      let values = semiRandomShuffle(valuesCopy, RANDOM_SHUFFLE_FACTOR)

      for(let i = 0; i<values.length; i+=2) {
        let value1 = values[i]
        let value2 = values[i+1]

        this.getComparisonView(value1, value2)
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