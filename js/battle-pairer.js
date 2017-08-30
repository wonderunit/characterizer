const {remote} = require('electron')
const knex = remote.getGlobal('knex')
const MIN_BATTTLE_COUNT = 2
const TOP_PERCENT_CUTOFF = .4
const TOP_RANK_CUTOFF = 20

module.exports = class BattlePairer {
  constructor(properties) {
    if(!properties.characterID) throw new Error("Missing characterID")
    this.characterID = properties.characterID

    if(!properties.choices) throw new Error("Missing choices")
    this.choices = properties.choices

    if(!properties.values) throw new Error("Missing values")
    this.values = properties.values

    if(!properties.battlePairs) throw new Error("Missing battlePairs")
    this.previousBattlePairs = properties.battlePairs

    // TODO: we should wait for ready further up the chain
    this.isReady = false

    this.valuesMap = properties.valuesMap

    this.valuesPercentRank = []
    
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
      if(this.isDuplicate(result)) {
        console.log(`Found duplicate!`)
        result = this.getBattle()
      }
      console.log(`getFillDataBattle`)
    } else {
      let roll = Math.random()
      if(roll < .6) {
        console.log(`getTopPercentileBattle`)
        result = this.getTopPercentileBattle()
      } else if(roll < .7) {
        console.log(`getTopPercentileAndRandomBattle`)
        result = this.getTopPercentileAndRandomBattle()
      } else if (roll < .8) {
        console.log(`getTopRankBattle`)
        result = this.getTopRankBattle()
      }
      if(!result) {
        console.log(`getRandomBattle`)
        result = this.getRandomBattle()
      } else {
        // We're letting the random roll for getRandomBattle fall through
        // the duplicate check in case we reach a point where all matches have been done.
        // TODO: check for the case where all matches have played out, and message it.
        if(this.isDuplicate(result)) {
          console.log(`Found duplicate!`)
          result = this.getBattle()
        }
      }
    }
    
    let randomizedResult = []
    let firstIndex = Math.floor(Math.random()*2)
    if(firstIndex === 0) {
      randomizedResult = [result[0], result[1]]
    } else {
      randomizedResult = [result[1], result[0]]
    }
    return randomizedResult
  }

  isDuplicate(battlePair) {
    let result = false
    if(!battlePair || battlePair.length < 2) {
      throw new Error("checkDuplicate expects an array of length >= 2")
    }
    var checkForPair = (contender1, contender2) => {
      if(this.previousBattlePairs.hasOwnProperty(contender1.id)) {
        let contender1Pairs = this.previousBattlePairs[contender1.id]
        if(contender1Pairs.hasOwnProperty(contender2.id) && contender1Pairs[contender2.id] > 0) {
          return true
        }
      }
      return false
    }

    result = checkForPair(battlePair[0], battlePair[1]) || checkForPair(battlePair[1], battlePair[0])
    return result
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

    return [this.valuesMap[this.values[indexOne].valueID], this.valuesMap[this.values[indexTwo].valueID]]
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

    return [this.valuesMap[this.values[indexOne].valueID], this.valuesMap[this.values[indexTwo].valueID]]
  }
  
  getTopPercentileAndRandomBattle() {
    let topIndex = this.values.length * TOP_PERCENT_CUTOFF
    if(topIndex < 2) {
      return null
    }
    let indexOne = Math.floor(Math.random()*topIndex)
    let indexTwo
    do {
      indexTwo = Math.floor(Math.random() * this.values.length)
    } while(indexTwo === indexOne)


    return [this.valuesMap[this.values[indexOne].valueID], this.valuesMap[this.values[indexTwo].valueID]]
  }
}