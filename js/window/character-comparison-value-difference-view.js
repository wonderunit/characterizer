const CharacterComparisonBaseView = require('./character-comparison-base-view.js')

module.exports = class CharacterComparisonValueDifferencesView extends CharacterComparisonBaseView {
  constructor(properties) {
    super(properties)

    this.comparisonView = document.createElement("div")
    this.comparisonView.setAttribute("id", "conflict-comparison-view")
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
          valueView.innerHTML = `<b>${this.valuesMap[valueGrouped.groupID].name}</b>`
          view.appendChild(valueView)

          let scoreView = document.createElement('div')
          scoreView.innerHTML = `difference: ${valueGrouped.diff}`
          view.appendChild(scoreView)

          let index = 0
          for(let characterValue of valueGrouped.values) {
            let characterScoreView = document.createElement('div')
            characterScoreView.innerHTML = `${this.selectedCharacters[index].name} score: ${characterValue.score}`
            view.appendChild(characterScoreView)
            index++
          }
          this.comparisonView.appendChild(view)
        }
      })
      .catch(console.error)
  }
}

