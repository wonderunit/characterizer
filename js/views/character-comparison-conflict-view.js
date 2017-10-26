const utils = require('../utils.js')
const CharacterComparisonBaseView = require('./character-comparison-base-view.js')
const FavoriteButton = require('./favorite-button.js')
const { semiRandomShuffle } = require('../utils.js')
const NUM_COMPARISON_ITEMS = 30
const RANDOM_SHUFFLE_FACTOR = 4

module.exports = class CharacterComparisonConflictView extends CharacterComparisonBaseView {
  constructor(properties) {
    super(properties)
    this.viewType = "all"

    this.viewTypeSelector = document.createElement("select")
    for(let type of ["all", "favorites, paired", "favorited pairs"]) {
      let option = document.createElement("option")
      option.setAttribute("value", type)
      option.innerHTML = type
      this.viewTypeSelector.appendChild(option)
    }
    this.viewTypeSelector.addEventListener('change', (event)=>{
      this.viewType = event.target.value
      this.updateView()
    })
    this.root.appendChild(this.viewTypeSelector)
    
    this.comparisonView = document.createElement("div")
    this.comparisonView.classList.add("comparison-view")
    this.root.appendChild(this.comparisonView)
    this.updateView()
  }

  updateView() {
    this.comparisonView.innerHTML = ``
    let headersContainer = document.createElement("div")
    headersContainer.classList.add("comparison-view-conflicts-header-container")
    this.comparisonView.appendChild(headersContainer)

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

    let conflictContainer
    switch(this.viewType) {
      case "favorites, paired":
        conflictContainer = this.getFavoriteValuesView() 
        break
      case "favorited pairs":
        conflictContainer = this.getFavoritePairedValuesView()
        break
      case "all":
      default:
        conflictContainer = this.getValuesView()
        break
    }
    this.comparisonView.appendChild(conflictContainer)
  }

  getValuesView() {
    let result = document.createElement("div")

    this.getSelectedCharacterValues()
      .then(inCharacterValueResults => {
        let characterValueResults = []
        for(let i = 0; i < inCharacterValueResults.length; i++) {
          let values = inCharacterValueResults[i].slice(0, NUM_COMPARISON_ITEMS)
          characterValueResults.push(semiRandomShuffle(values, RANDOM_SHUFFLE_FACTOR))
        }

        for(let valueIndex = 0; valueIndex < NUM_COMPARISON_ITEMS; valueIndex++) {
          let conflictContainer = document.createElement("div")
          conflictContainer.classList.add("comparison-view-conflict-container")

          var self = this
          let favButton = new FavoriteButton()
          conflictContainer.appendChild(favButton.getView())
      
          // we use this in the add favorite event.
          let favoriteData = {}
          // we use this to check if the favorite pair exists.
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
            favButton.setChecked(true)
            favButton.setEnabled(false)
          } else {
            var self = this
            favButton.setHandler(function(event) {
              self.emit('add-comparison-favorite', favoriteData)
              favButton.setChecked(true)
              favButton.setEnabled(false)
            })
            favButton.setChecked(false)
            favButton.setEnabled(true)
          }
    
          result.appendChild(conflictContainer)
        }
      })
      .catch(console.error)
    
    return result
  }
  
  getFavoriteValuesView() {
    let result = document.createElement("div")
    let character1ID = this.selectedCharacters[0].id
    let character2ID = this.selectedCharacters[1].id
    let favoritePairs = []
    Promise.all([
      this.getCharacterValueFavorites(character1ID),
      this.getCharacterValueFavorites(character2ID),
      this.getCharacterValuesMap(character1ID),
      this.getCharacterValuesMap(character2ID)
    ]).then(results => {
      let characterValueFavorites1 = results[0].values
      let characterValueFavorites2 = results[1].values
      let characterValueMap1 = results[2]
      let characterValueMap2 = results[3]

      let characterValues1 = []
      for(let characterValueFavorite of characterValueFavorites1) {
        characterValues1.push(characterValueMap1[characterValueFavorite])
      }
      characterValues1.sort((a, b) => {
        return b.score - a.score
      })
      
      let characterValues2 = []
      for(let characterValueFavorite of characterValueFavorites2) {
        characterValues2.push(characterValueMap1[characterValueFavorite])
      }
      characterValues2.sort((a, b) => {
        return b.score - a.score
      })

      let favoritePairLength = Math.min(characterValues1.length, characterValues2.length)
      let favoritePairs = []
      for(let i = 0; i<favoritePairLength; i++) {
        let conflictContainer = document.createElement("div")
        conflictContainer.classList.add("comparison-view-conflict-container")
  
        let value1 = this.valuesMap[characterValues1[i].valueID]
        let value2 = this.valuesMap[characterValues2[i].valueID]

        let favButton = document.createElement('div')
        let isFavorite = utils.checkObjectPath([character1ID, value1.id, character2ID, value2.id], this.valueComparisonFavorites) 
          || utils.checkObjectPath([character2ID, value2.id, character1ID, value1.id], this.valueComparisonFavorites)
        if(isFavorite) {
          favButton.innerHTML = `favorited`
        } else {
          var self = this
          let favoriteData = { 
            "character1ID": character1ID,
            "character2ID": character2ID,
            "value1ID": value1.id,
            "value2ID": value2.id,
          }
          favButton.innerHTML = `add favorite`
          favButton.addEventListener('mouseup', function(event) {
            event.target.innerHTML = `favorited`
            self.emit('add-comparison-favorite', favoriteData)
          })
        }
        conflictContainer.appendChild(favButton)
  
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
    })

    return result
  }

  getFavoritePairedValuesView() {
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

