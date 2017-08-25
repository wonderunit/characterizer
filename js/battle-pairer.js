const {remote} = require('electron')
var knex = remote.getGlobal('knex')

module.exports = class BattlePairer {
  constructor(properties) {
    if(!properties.characterID) throw new Error("Missing characterID")
    this.characterID = properties.characterID

    if(!properties.choices) throw new Error("Missing choices")
    this.choices = properties.choices

    if(!properties.values) throw new Error("Missing values")
    this.values = []
    properties.values
      .then(inValues => { this.setValues(inValues) })
  }

  getBattle() {
    let indexOne = Math.floor(Math.random() * this.choices.length)
    let indexTwo
    do {
      indexTwo = Math.floor(Math.random() * this.choices.length)
    } while(indexTwo === indexOne)

    return [this.choices[indexOne], this.choices[indexTwo]]
  }

  setValues(inValues) {
    this.values = inValues
  }
}