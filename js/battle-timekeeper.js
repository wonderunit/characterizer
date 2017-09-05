const EventEmitter = require('events').EventEmitter

module.exports = class BattleTimeKeeper extends EventEmitter {
  constructor() {
    super()
    this.currentBattleStart = Date.now()
    this.battleLog = []
    this.startTime = Date.now()
  }

  onBattleStart() {
    this.currentBattleStart = Date.now()
    if(!this.startTime) {
      this.startTime = this.currentBattleStart
    }
  }

  onBattleOutcome() {
    let end = Date.now()
    this.battleLog.push(end - this.currentBattleStart)
    this.currentBattleStart = 0
  }
}