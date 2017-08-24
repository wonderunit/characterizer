const EventEmitter = require('events').EventEmitter

module.exports = class ValuesViewDots extends EventEmitter {
  constructor(properties) {
    super()

    this.valuesMap = properties.valuesMap

    this.root = document.createElement('div')
    this.root.setAttribute("id", "values-view")
    this.root.setAttribute("class", "values-view-linechart")
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
    let curIndex = 0
    for(let value of this.values) {
      let valueView = document.createElement('div')
      valueView.setAttribute("class", "value-list-name-linechart")
      valueView.setAttribute("style", `left: ${(curIndex / this.values.length)*100}%; bottom: ${value.score*100}%`)
      let nameView = document.createElement('div')
      nameView.setAttribute("class", "value-list-label-linechart")
      nameView.innerHTML = `${this.valuesMap[value.valueID.toString()].name}`
      valueView.addEventListener('mouseenter', function(event) {
        nameView.classList.add('value-list-label-linechart-show')
      })
      valueView.addEventListener('mouseleave', function(event) {
        nameView.classList.remove('value-list-label-linechart-show')
      })
      valueView.appendChild(nameView)
      this.root.appendChild(valueView)
      curIndex++
    }
  }

  onBattleOutcome(battleOutcome) {
    this.updateView()
  }
}