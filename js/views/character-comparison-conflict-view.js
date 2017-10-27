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
    this.viewTypeSelector.classList.add("comparison-view-selector")
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
        vsView.classList.add("text-align-center")
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
        if(inCharacterValueResults.length < 2) {
          return
        }

        let characterValueResults = []
        for(let i = 0; i < inCharacterValueResults.length; i++) {
          let values = inCharacterValueResults[i].slice(0, NUM_COMPARISON_ITEMS)
          characterValueResults.push(semiRandomShuffle(values, RANDOM_SHUFFLE_FACTOR))
        }

        for(let valueIndex = 0; valueIndex < NUM_COMPARISON_ITEMS; valueIndex++) {

          var self = this
          let favButton = new FavoriteButton()
      
          // we use this in the add favorite event.
          let favoriteData = {}
          // we use this to check if the favorite pair exists.
          let favoritesPaths = []

          let character1Values = characterValueResults[0]
          let value1 = character1Values[valueIndex]
          let character2Values = characterValueResults[1]
          let value2 = character2Values[valueIndex]

          let conflictContainer = this.getComparisonView(value1, value2)
      
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
        
        let value1 = characterValueMap1[characterValues1[i].valueID]
        let value2 = characterValueMap2[characterValues2[i].valueID]
        
        let conflictContainer = this.getComparisonView(value1, value2)
        result.appendChild(conflictContainer)
      }
    })

    return result
  }

  getFavoritePairedValuesView() {
    let result = document.createElement("div")

    let character1ID = this.selectedCharacters[0].id
    let character2ID = this.selectedCharacters[1].id
    Promise.all([
      this.getCharacterValuesMap(character1ID),
      this.getCharacterValuesMap(character2ID)
    ]).then(results => {
      let characterValueMap1 = results[0]
      let characterValueMap2 = results[1]

      let favoritePairs = []
      if(this.characterComparisonFavorites[character1ID] 
        && this.characterComparisonFavorites[character1ID][character2ID]) {
  
          favoritePairs = this.characterComparisonFavorites[character1ID][character2ID]
      }
  
      for(let j = 0; j<favoritePairs.length; j++) {
        let favoritePair = favoritePairs[j]
        let value1ID = favoritePair[character1ID]
        let value2ID = favoritePair[character2ID]
        let value1 = characterValueMap1[value1ID]
        let value2 = characterValueMap2[value2ID]
        
        let conflictContainer = this.getComparisonView(value1, value2)
  
        result.appendChild(conflictContainer)
      }
    })
    .catch(console.error)

    return result
  }

  getComparisonView(value1, value2) {
    let conflictContainer = document.createElement("div")
    conflictContainer.classList.add("comparison-view-conflict-container")

    let favButton = new FavoriteButton()

    let favoriteData = {}
    favoriteData[`character1ID`] = value1.characterID
    favoriteData[`value1ID`] = value1.valueID
    favoriteData[`character2ID`] = value2.characterID
    favoriteData[`value2ID`] = value2.valueID
    let isFavorite = utils.checkObjectPath([value1.characterID, value1.valueID, value2.characterID, value2.valueID], this.valueComparisonFavorites) 
          || utils.checkObjectPath([value2.characterID, value2.valueID, value1.characterID, value1.valueID], this.valueComparisonFavorites)

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

    let getValueView = (value)=>{
      let name = this.valuesMap[value.valueID].name
      let nameView = document.createElement("div")
      nameView.classList.add("comparison-view-value-view")
      nameView.innerHTML = name
      return nameView
    }

    let nameView1 = getValueView(value1)
    nameView1.classList.add("text-align-right")
    conflictContainer.appendChild(nameView1)

    let centerContainer = document.createElement("div")
    centerContainer.classList.add('conflict-container-center')
    conflictContainer.appendChild(centerContainer)

    centerContainer.appendChild(favButton.getView())
    let vsView = document.createElement("div")
    vsView.innerHTML = `vs`
    centerContainer.appendChild(vsView)

    let nameView2 = getValueView(value2)
    conflictContainer.appendChild(nameView2)

    return conflictContainer
  }


}

