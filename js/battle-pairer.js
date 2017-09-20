const {remote} = require('electron')
const knex = remote.getGlobal('knex')
const MIN_BATTTLE_COUNT = 2
const TOP_PERCENT_CUTOFF = .1
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
    
    if(!properties.favorites) throw new Error("Missing favorites")
    this.favorites = properties.favorites

    this.battleModes = [
      {
        "function": this.getTopPercentileBattle.bind(this),
        "weight": 40
      },
      {
        "function": this.getTopPercentileAndRandomBattle.bind(this),
        "weight": 10
      },
      {
        "function": this.getTopRankBattle.bind(this),
        "weight": 40
      },
      {
        "function": this.getRandomBattle.bind(this),
        "weight": 10
      },
      {
        "function": this.getFavoritesAndTopPercentileBattle.bind(this),
        "weight": 40
      },
      {
        "function": this.getFavoritesAndRandomBattle.bind(this),
        "weight": 40
      },
      {
        "function": this.getFavoritesBattle.bind(this),
        "weight": 40
      }
    ]

    this.valuesMap = properties.valuesMap

    this.valuesPercentRank = []
    
    // keeps the values separated by battle count.
    this.battleChoiceTiers = []
    for(var i = 0; i<MIN_BATTTLE_COUNT; i++) {
      this.battleChoiceTiers.push([])
    }
  }

  init() {
    return new Promise((fulfill, reject) => {
      let self = this
      for(let i=0; i<this.battleChoiceTiers.length; i++) {
        knex('CharacterValues').where({characterID: this.characterID, battleCount: i})
          .then(function(values) {
            self.battleChoiceTiers[i] = values
            fulfill()
          })
          .catch(reject)
      }
    })
  }

  getBattle(rechooseCount=0) {
    // Make sure enough data selection mode.
    let result = this.getFillDataBattle()
    if(result && result.length > 1) {
      if(this.isDuplicate(result)) {
        console.log(`Found duplicate!`)
        return this.getBattle(++rechooseCount)
      }
      console.log(`getFillDataBattle`)
    } else {
      let battleMode = this.chooseRandomBattleMode()
      result = battleMode()
    }
    if(!result) {
      console.log(`Didn't find valid candidates for battle mode.`)
      return this.getBattle(rechooseCount)
    }
    // TODO: check for the case where all matches have played out, and message it.
    // For now, let's just let it try to re-choose
    if(this.isDuplicate(result) && rechooseCount < 4) {
      console.log(`Found duplicate!`)
      return this.getBattle(++rechooseCount)
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
    var self = this
    var checkForPair = (contender1, contender2) => {
      if(self.previousBattlePairs.hasOwnProperty(contender1.id)) {
        let contender1Pairs = self.previousBattlePairs[contender1.id]
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
    console.log(`getRandomBattle`)
    let indexOne = Math.floor(Math.random() * this.choices.length)
    let indexTwo
    do {
      indexTwo = Math.floor(Math.random() * this.choices.length)
    } while(indexTwo === indexOne)

    return [this.choices[indexOne], this.choices[indexTwo]]
  }

  getTopRankBattle() {
    console.log(`getTopRankBattle`)
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
    console.log(`getTopPercentileBattle`)
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
    console.log(`getTopPercentileAndRandomBattle`)
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

  getFavoritesAndRandomBattle() {
    console.log(`getFavoritesAndTopPercentileBattle`)
    let favoriteValues = this.favorites.values
    if(favoriteValues.length < 1) {
      return null
    }
    let favoritesIndex = Math.floor(Math.random() * favoriteValues.length)
    let favoritesID = favoriteValues[favoritesIndex]
    let topIndex = this.values.length * TOP_PERCENT_CUTOFF
    if(topIndex < 2) {
      return null
    }
    let randomID
    do {
      let randomIndex = Math.floor(Math.random() * this.choices.length)
      randomID = this.values[randomIndex].valueID
    } while(randomID === favoritesID)
    return [this.valuesMap[favoritesID], this.valuesMap[randomID]]
  }

  getFavoritesAndTopPercentileBattle() {
    console.log(`getFavoritesAndTopPercentileBattle`)
    let favoriteValues = this.favorites.values
    if(favoriteValues.length < 1) {
      return null
    }
    let favoritesIndex = Math.floor(Math.random() * favoriteValues.length)
    let favoritesID = favoriteValues[favoritesIndex]
    let topIndex = this.values.length * TOP_PERCENT_CUTOFF
    if(topIndex < 2) {
      return null
    }
    let topID
    do {
      let indexOne = Math.floor(Math.random()*topIndex)
      topID = this.values[indexOne].valueID
    } while(topID === favoritesID)
    return [this.valuesMap[favoritesID], this.valuesMap[topID]]
  }

  getFavoritesBattle() {
    console.log(`getFavoritesBattle`)

    let favoriteValues = this.favorites.values
    if(favoriteValues.length < 2) {
      return null
    }

    let indexOne = Math.floor(Math.random() * favoriteValues.length)
    let indexTwo
    do {
      indexTwo = Math.floor(Math.random() * favoriteValues.length)
    } while(indexTwo === indexOne)

    return [this.valuesMap[favoriteValues[indexOne]], this.valuesMap[favoriteValues[indexTwo]]]
  }

  chooseRandomBattleMode() {
    let totalWeight = 0
    for (let battleMode of this.battleModes) {
      totalWeight += battleMode.weight
    }
    let randomNum = this.rand(0, totalWeight)
    let weightSum = 0
    for (let battleMode of this.battleModes) {
      weightSum += battleMode.weight
      weightSum = +weightSum.toFixed(2)
      if (randomNum <= weightSum) {
        return battleMode.function
      }
    }
  }

  rand (min, max) {
    return Math.random() * (max - min) + min
  }
}