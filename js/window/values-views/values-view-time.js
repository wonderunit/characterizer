module.exports = class ValuesViewTime {
  constructor(properties) {
    this.battleTimeKeeper = properties.battleTimeKeeper

    this.root = document.createElement('div')
    this.root.setAttribute("id", "values-view")
    this.battleTime = document.createElement('div')
    this.battleTime.setAttribute("id", "values-view-battle-time")
    this.root.appendChild(this.battleTime)
    this.averageTime = document.createElement('div')
    this.averageTime.setAttribute("id", "values-view-average-time")
    this.root.appendChild(this.averageTime)
    this.totalTime = document.createElement('div')
    this.totalTime.setAttribute("id", "values-view-total-time")
    this.root.appendChild(this.totalTime)

    setInterval(()=>{
      let elapsed = Date.now() - this.battleTimeKeeper.currentBattleStart
      let friendly = this.convertMS(elapsed)
      this.battleTime.innerHTML = `Current Battle Time: ${friendly.m}:${friendly.s}`
    }, 500)

    this.values = []
  }

  convertMS(ms) {
    var d, h, m, s;
    s = Math.floor(ms / 1000);
    m = Math.floor(s / 60);
    s = s % 60;
    h = Math.floor(m / 60);
    m = m % 60;
    d = Math.floor(h / 24);
    h = h % 24;
    return { d: d, h: h, m: m, s: s };
  };

  getView() {
    return this.root
  }

  updateView() {
    let total = 0
    let count = 0
    for(let elapsed of this.battleTimeKeeper.battleLog) {
      total += elapsed
      count++
    }
    let average = total / count
    let friendlyAverage = this.convertMS(average)
    this.averageTime.innerHTML = `Battle Time Average: ${friendlyAverage.m}:${friendlyAverage.s}`

    let friendlyTotal = this.convertMS(total)
    this.totalTime.innerHTML = `Battle Total: ${friendlyTotal.h}:${friendlyTotal.m}:${friendlyTotal.s}`
  }

  onBattleOutcome(battleOutcome) {
    this.updateView()
  }
}