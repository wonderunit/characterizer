const CharacterComparisonBaseView = require('./character-comparison-base-view.js')

module.exports = class CharacterComparisonValueDifferencesView extends CharacterComparisonBaseView {
  constructor(properties) {
    super(properties)

    this.comparisonView = document.createElement("div")
    this.comparisonView.setAttribute("id", "conflict-comparison-view")
    this.root.appendChild(this.comparisonView)
  }

  updateView() {
    this.getSelectedCharacterValues()
      .then(charactersValues => {

        let index = 0
        let valuesMaps = []
        for(let characterValues of charactersValues) {
          let characterValuesMap = {}
          for(let characterValue of characterValues) {
            characterValuesMap[characterValue.valueID] = characterValue
          }
          valuesMaps.push(characterValuesMap)
          index++
        }

        let valuesGrouped = []
        for(let characterValue of charactersValues[0]) {
          let groupID = characterValue.valueID
          let group = {
            groupID: groupID
          }
          let groupValues = []

          let max = 0, min = 1, diff = 0
          for(let valuesMap of valuesMaps) {
            let characterValue = valuesMap[groupID]
            if(characterValue.score > max) {
              max = characterValue.score
            }
            if(characterValue.score < min) {
              min = characterValue.score
            }
            group.diff = max - min
            groupValues.push(valuesMap[groupID])
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
          valueView.innerHTML = `<b>${this.valuesMap[valueGrouped.groupID].name}</b>`
          view.appendChild(valueView)

          let scoreView = document.createElement('div')
          scoreView.innerHTML = `difference: ${valueGrouped.diff}`
          view.appendChild(scoreView)

          let index = 0
          for(let characterValue of valueGrouped.values) {
            let characterScoreView = document.createElement('div')
            characterScoreView.innerHTML = `${this.charactersMap[this.selectedCharacters[index]].name} score: ${characterValue.score}`
            view.appendChild(characterScoreView)
            index++
          }
          this.comparisonView.appendChild(view)
        }
      })
      .catch(console.error)
  }
}

