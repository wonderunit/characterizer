const EventEmitter = require('events').EventEmitter
const {remote} = require('electron')

let knex = remote.getGlobal('knex')

module.exports = class CharacterValue {
  constructor(record, options) {
    this.characterID = record.characterID
    this.valueID = record.valueID
    this.score = record.score
    this.name = options.name

    knex.select()
      .from('ValuesBattleOutcomes')
      .where({characterID: this.characterID, winner: this.valueID})
      .then(winningOutcomes => {
        this.winCount = winningOutcomes.length
      })
      .catch(console.error)

    knex.select()
      .from('ValuesBattleOutcomes')
      .where({characterID: this.characterID, loser: this.valueID})
      .then(losingOutcomes => {
        this.lossCount = losingOutcomes.length
      })
      .catch(console.error)
  }

  getScore() {
    return this.score
  }

  updateWithBattleOutcome(battleOutcome) {
    if(this.valueID == battleOutcome.winner) {
      this.winCount++
    } else if(this.valueID == battleOutcome.loser) {
      this.lossCount++
    }

    this.score = this.winCount / (this.winCount + this.lossCount)

    let record = {
      characterID: this.characterID,
      valueID: this.valueID,
      score: this.score
    }
    knex('CharacterValues').insert(record)
      .then(()=>{})
      .catch(console.error)
  }
}