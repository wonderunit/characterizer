module.exports = class ValuesViewBattleCount {
  constructor(properties) {
    this.valuesMap = properties.valuesMap
    this.battlePairer = properties.battlePairer
    
    this.root = document.createElement('div')
    this.root.setAttribute("id", "values-view")
    this.root.setAttribute("class", "values-view-battlecount")
    this.updateView()
  }

  getView() {
    return this.root
  }

  updateView() {
    this.root.innerHTML = ''
    let curIndex = 0
    for(let battleChoiceTier of this.battlePairer.battleChoiceTiers) {
      let curTierDiv = document.createElement('div')
      curTierDiv.setAttribute("style", `width: ${100/this.battlePairer.battleChoiceTiers.length}vw;`)
      let curTierHeader = document.createElement('h3')
      curTierHeader.innerHTML = curIndex.toString()
      curTierDiv.appendChild(curTierHeader)
      curTierDiv.setAttribute("class", "values-view-battlecount-tier")
      for(let value of battleChoiceTier) {
        let valueView = document.createElement('div')
        valueView.setAttribute("class", "value-list-name-battlecount")
        valueView.innerHTML = `${this.valuesMap[value.valueID.toString()].name}`
        curTierDiv.appendChild(valueView)
      }
      curIndex++
      this.root.appendChild(curTierDiv)
    }
  }

  onBattleOutcome(battleOutcome) {
    this.updateView()
  }
}