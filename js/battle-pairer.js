const {remote} = require('electron')
const knex = remote.getGlobal('knex')
const MIN_BATTTLE_COUNT = 4
const TOP_PERCENT_CUTOFF = .2
const TOP_RANK_CUTOFF = 4

module.exports = class BattlePairer {
  constructor(properties) {
    if(!properties.characterID) throw new Error("Missing characterID")
    this.characterID = properties.characterID

    if(!properties.choices) throw new Error("Missing choices")
    this.choices = properties.choices

    if(!properties.values) throw new Error("Missing values")
    this.values = []

    this.valuesMap = properties.valuesMap

    this.valuesPercentRank = []

    properties.values
      .then(inValues => { this.setValues(inValues) })
    
    // keeps the values separated by battle count.
    this.battleChoiceTiers = []
    for(var i = 0; i<MIN_BATTTLE_COUNT; i++) {
      this.battleChoiceTiers.push([])
    }
    let self = this
    for(let i=0; i<this.battleChoiceTiers.length; i++) {
      knex('CharacterValues').where({characterID: this.characterID, battleCount: i})
        .then(function(values) {
          self.battleChoiceTiers[i] = values
        })
        .catch(console.error)
    }
  }

  getBattle() {
    // Make sure enough data selection mode.
    let result = this.getFillDataBattle()
    if(result && result.length > 1) {
      console.log(`getFillDataBattle`)
      return result
    }

    let roll = Math.random()
    if(roll < .7) {
      console.log(`getTopPercentileBattle`)
      result = this.getTopPercentileBattle()
    } else if(roll < .8) {
      console.log(`getTopPercentileAndRandomBattle`)
      result = this.getTopPercentileAndRandomBattle()
    } else if (roll < .9) {
      console.log(`getTopRankBattle`)
      result = this.getTopRankBattle()
    }
    if(!result) {
      console.log(`getRandomBattle`)
      result = this.getRandomBattle()
    }

    // TODO: check to make sure we're not re-running battles.
    
    return result
  }

  setValues(inValues) {
    this.values = inValues
  }

  onBattleOutcome(battleOutcome) {
    let i = 0;
    let isWinnerFound = false
    let isLoserFound = false
    let self = this
    function moveToNextBucket(battleChoiceTier, i, j) {
      let target = battleChoiceTier.splice(j, 1)[0]
      if(i+1<self.battleChoiceTiers.length) {
        self.battleChoiceTiers[i+1].push(target)
      }
    }
    function findTarget(battleChoiceTier, targetID) {
      let j = 0;
      for(let value of battleChoiceTier) {
        if(value.valueID === targetID) {
          moveToNextBucket(battleChoiceTier, i, j)
          return true
        }
        j++
      }
      return false
    }
    for(let battleChoiceTier of this.battleChoiceTiers) {
      if(!isWinnerFound) {
        isWinnerFound = findTarget(battleChoiceTier, battleOutcome.winner)
      }
      if(!isLoserFound) {
        isLoserFound = findTarget(battleChoiceTier, battleOutcome.loser)
      }
      if(isWinnerFound && isLoserFound) {
        break
      }
      i++
    }
  }

  getFillDataBattle() {
    let contender1, contender2
    for(let battleChoiceTier of this.battleChoiceTiers) {
      if(battleChoiceTier.length == 0) {
        continue
      } else if(battleChoiceTier.length == 1) {
        if(!contender1) {
          contender1 = battleChoiceTier[0]
          continue
        } else if(!contender2) {
          contender1 = battleChoiceTier[0]
          continue
        }
      } else {
        let indexOne
        if(!contender1) {
          indexOne = Math.floor(Math.random() * battleChoiceTier.length)
          contender1 = battleChoiceTier[indexOne]
        }
        let indexTwo
        do {
          indexTwo = Math.floor(Math.random() * battleChoiceTier.length)
        } while(indexTwo === indexOne)
        contender2 = battleChoiceTier[indexTwo]
      }
      if(contender1 && contender2) {
        break
      }
    }

    if(contender1 && contender2) {
      return [this.valuesMap[contender1.valueID], this.valuesMap[contender2.valueID]]
    }
  }

  getRandomBattle() {
    let indexOne = Math.floor(Math.random() * this.choices.length)
    let indexTwo
    do {
      indexTwo = Math.floor(Math.random() * this.choices.length)
    } while(indexTwo === indexOne)

    return [this.choices[indexOne], this.choices[indexTwo]]
  }

  getTopRankBattle() {
    if(this.values.length < TOP_RANK_CUTOFF) {
      return
    }

    let topIndex = TOP_RANK_CUTOFF
    if(topIndex < 2) {
      return null
    }
    let indexOne = Math.floor(Math.random()*topIndex)
    let indexTwo
    do {
      indexTwo = Math.floor(Math.random()*topIndex)
    } while(indexTwo === indexOne)

    return [this.choices[indexOne], this.choices[indexTwo]]
  }
  
  getTopPercentileBattle() {
    let topIndex = this.values.length * TOP_PERCENT_CUTOFF
    if(topIndex < 2) {
      return null
    }
    let indexOne = Math.floor(Math.random()*topIndex)
    let indexTwo
    do {
      indexTwo = Math.floor(Math.random()*topIndex)
    } while(indexTwo === indexOne)

    return [this.choices[indexOne], this.choices[indexTwo]]
  }
  
  getTopPercentileAndRandomBattle() {
    let topIndex = this.values.length * TOP_PERCENT_CUTOFF
    if(topIndex < 2) {
      return null
    }
    let indexOne = Math.floor(Math.random()*topIndex)
    let indexTwo
    do {
      indexTwo = Math.floor(Math.random() * this.choices.length)
    } while(indexTwo === indexOne)

    return [this.choices[indexOne], this.choices[indexTwo]]
  }
}