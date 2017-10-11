const utils = require('../utils.js')
const CharacterComparisonBaseView = require('./character-comparison-base-view.js')
const CharacterView = require('./character-selector-multiple.js')
const { semiRandomShuffle } = require('../utils.js')
const NUM_COMPARISON_ITEMS = 30
const RANDOM_SHUFFLE_FACTOR = 4

module.exports = class CharacterComparisonConflictView extends CharacterComparisonBaseView {
  constructor(properties) {
    super(properties)

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
    
    this.comparisonView = document.createElement("div")
    this.comparisonView.setAttribute("id", "conflict-comparison-view")
    this.root.appendChild(this.comparisonView)
    this.updateView()
  }

  updateView() {
    this.getSelectedCharacterValues()
    .then(inCharacterValueResults => {
        let characterValueResults = []
        for(let i = 0; i < inCharacterValueResults.length; i++) {
          let values = inCharacterValueResults[i].slice(0, NUM_COMPARISON_ITEMS)
          characterValueResults.push(semiRandomShuffle(values, RANDOM_SHUFFLE_FACTOR))
        }

        this.comparisonView.innerHTML = ``
        let headersContainer = document.createElement("div")
        headersContainer.classList.add("comparison-view-conflicts-header-container")
        this.comparisonView.appendChild(headersContainer)

        let container = document.createElement("div")
        container.classList.add("comparison-view-conflicts-values-container")
        for(let i = 0; i<this.selectedCharacters.length; i++) {
          if(i > 0) {
            let vsView = document.createElement("div")
            vsView.innerHTML = `vs`
            headersContainer.appendChild(vsView)
          }
          let characterName = document.createElement("h2")
          characterName.classList.add("comparison-view-conflicts-header")
          characterName.innerHTML = this.selectedCharacters[i].name
          headersContainer.appendChild(characterName)
        }

        if(!this.isFiltering) {
          let conflictContainer = this.getValuesView(characterValueResults)
          if(conflictContainer) {
            container.appendChild(conflictContainer)
          }
        } else {
          let conflictContainer = this.getFavoritesValuesView() 
          container.appendChild(conflictContainer)
        }

        this.comparisonView.appendChild(container)
      })
      .catch(console.error)
  }

  getValuesView(characterValueResults) {
    let result = document.createElement("div")
    for(let valueIndex = 0; valueIndex < NUM_COMPARISON_ITEMS; valueIndex++) {
      let conflictContainer = document.createElement("div")
      conflictContainer.classList.add("comparison-view-conflict-container")
  
      let favButton = document.createElement('div')
      favButton.innerHTML = `add favorite`
      conflictContainer.appendChild(favButton)
  
      let favoriteData = {}
      let favoritesPaths = []
      for(var j = 0; j < characterValueResults.length; j++) {
        if(j > 0) {
          let vsView = document.createElement("div")
          vsView.innerHTML = `vs`
          conflictContainer.appendChild(vsView)
        }
        let characterValues = characterValueResults[j]
        let value = characterValues[valueIndex]
        let name = this.valuesMap[value.valueID].name
        let nameView = document.createElement("div")
        nameView.innerHTML = name
        conflictContainer.appendChild(nameView)
  
        favoriteData[`character${j+1}ID`] = value.characterID
        favoriteData[`value${j+1}ID`] = value.valueID
        favoritesPaths.push([value.characterID, value.valueID])
      }
  
      let isFavorite = false
      if(favoritesPaths.length > 1) {
        isFavorite = utils.checkObjectPath(favoritesPaths[0].concat(favoritesPaths[1]), this.valueComparisonFavorites) 
          || utils.checkObjectPath(favoritesPaths[1].concat(favoritesPaths[0]), this.valueComparisonFavorites)
      }
      if(isFavorite) {
        favButton.innerHTML = `favorited`
      } else {
        var self = this
        favButton.addEventListener('mouseup', function(event) {
          event.target.innerHTML = `favorited`
          self.emit('add-comparison-favorite', favoriteData)
        })
      }
  
      if(this.isFiltering && isFavorite) {
        result.appendChild(conflictContainer)
      } else if(!this.isFiltering) {
        result.appendChild(conflictContainer)
      }
    }
    return result
  }
  
  getFavoritesValuesView() {
    let result = document.createElement("div")
    let character1ID = this.selectedCharacters[0].id
    let character2ID = this.selectedCharacters[1].id

    let favoritePairs = []
    if(this.characterComparisonFavorites[character1ID] 
      && this.characterComparisonFavorites[character1ID][character2ID]) {

        favoritePairs = this.characterComparisonFavorites[character1ID][character2ID]
    }

    for(let j = 0; j<favoritePairs.length; j++) {
      let conflictContainer = document.createElement("div")
      conflictContainer.classList.add("comparison-view-conflict-container")

      let favButton = document.createElement('div')
      favButton.innerHTML = `favorited`
      conflictContainer.appendChild(favButton)

      let favoritePair = favoritePairs[j]
      let value1ID = favoritePair[character1ID]
      let value2ID = favoritePair[character2ID]
      let value1 = this.valuesMap[value1ID]
      let value2 = this.valuesMap[value2ID]

      let nameView = document.createElement("div")
      nameView.innerHTML = value1.name
      conflictContainer.appendChild(nameView)

      let vsView = document.createElement("div")
      vsView.innerHTML = `vs`
      conflictContainer.appendChild(vsView)

      nameView = document.createElement("div")
      nameView.innerHTML = value2.name
      conflictContainer.appendChild(nameView)

      result.appendChild(conflictContainer)
    }

    return result
  }
}

