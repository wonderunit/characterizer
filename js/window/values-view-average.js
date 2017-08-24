const EventEmitter = require('events').EventEmitter

module.exports = class ValuesViewAverage extends EventEmitter {
  constructor(properties) {
    super()

    this.valuesMap = properties.valuesMap

    this.root = document.createElement('div')
    this.root.setAttribute("id", "values-view")
    this.values = []

    properties.values.then(inValues => {
      this.values = inValues
      this.updateView()
    })
  }

  getView() {
    return this.root
  }

  updateView() {
    this.root.innerHTML = ''
    for(let value of this.values) {
      let valueView = document.createElement('div')
      valueView.setAttribute("class", "value-list-name")
      let progressView = document.createElement('div')
      progressView.setAttribute("class", "value-list-progress")
      progressView.setAttribute("style", `width: ${value.score*100}%`)
      valueView.appendChild(progressView)
      let nameView = document.createElement('div')
      nameView.setAttribute("class", "value-list-label")
      nameView.innerHTML = `${this.valuesMap[value.valueID.toString()].name} | ${value.score} | Wins: ${value.wins}, Losses: ${value.losses}`
      valueView.appendChild(nameView)
      this.root.appendChild(valueView)
    }
  }

  onBattleOutcome(battleOutcome) {
    this.updateView()
  }
}