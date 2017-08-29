const EventEmitter = require('events').EventEmitter

module.exports = class ValuesViewNone extends EventEmitter {
  constructor(properties) {
    super()

    this.root = document.createElement('div')
    this.root.setAttribute("id", "values-view")
    this.values = []
  }

  getView() {
    return this.root
  }

  updateView() {
    this.root.innerHTML = ''
  }

  onBattleOutcome(battleOutcome) {
    this.updateView()
  }
}