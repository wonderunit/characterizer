const utils = require('../utils.js')
const CharacterComparisonBaseView = require('./character-comparison-base-view.js')
const FavoriteButton = require('./favorite-button.js')

module.exports = class CharacterComparisonValueDifferencesView extends CharacterComparisonBaseView {
  constructor(properties) {
    super(properties)

    this.comparisonView = document.createElement("div")
    this.comparisonView.classList.add("comparison-view")
    this.comparisonView.classList.add("align-items-center")
    this.root.appendChild(this.comparisonView)
    this.updateView()
  }

  updateView() {
    this.comparisonView.innerHTML = ``
    
    if(this.selectedCharacters.length < 2) {
      return
    }
    this.getSelectedCharacterValues()
      .then(charactersValues => {

        let valuesGrouped = []
        for(let curCharacterValue of charactersValues[0]) {
          let groupID = curCharacterValue.valueID
          let group = {
            groupID: groupID
          }
          let groupValues = [curCharacterValue]

          let max = curCharacterValue.score, min = curCharacterValue.score, diff = 0
          for(let i = 1; i<charactersValues.length; i++) {
            for(let characterValue of charactersValues[i]) {
              if(characterValue.valueID === groupID) {
                if(characterValue.score > max) {
                  max = characterValue.score
                }
                if(characterValue.score < min) {
                  min = characterValue.score
                }
                group.diff = max - min
                groupValues.push(characterValue)
                break
              }

            }
          }
          group.values = groupValues
          valuesGrouped.push(group)
        }

        valuesGrouped.sort((a, b) => {
          return b.diff - a.diff
        })

        for(let valueGrouped of valuesGrouped) {
          let view = document.createElement('div')
          view.setAttribute("id", "value-difference-view")

          let valueView = document.createElement('div')
          valueView.classList.add("value-difference-view-value")
          valueView.innerHTML = `${this.valuesMap[valueGrouped.groupID].name}`
          view.appendChild(valueView)

          let scoreContainer = document.createElement("div")
          scoreContainer.classList.add("value-difference-view-score-container")
          view.appendChild(scoreContainer)

          var self = this
          let favButton = new FavoriteButton()
          scoreContainer.appendChild(favButton.getView())

          let scoreView = document.createElement('div')
          scoreView.innerHTML = `Difference: ${valueGrouped.diff}`
          scoreContainer.appendChild(scoreView)

          let index = 0
          let favoriteData = {}
          let favoritesPaths = []
          for(let characterValue of valueGrouped.values) {
            let characterScoreView = document.createElement('div')
            characterScoreView.innerHTML = `${this.selectedCharacters[index].name} score: ${characterValue.score}`
            scoreContainer.appendChild(characterScoreView)
            favoriteData[`character${index+1}ID`] = characterValue.characterID
            favoriteData[`value${index+1}ID`] = characterValue.valueID
            favoritesPaths.push([characterValue.characterID, characterValue.valueID])
            index++
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

          this.comparisonView.appendChild(view)
        }
      })
      .catch(console.error)
  }
}

