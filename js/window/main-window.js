const {remote} = require('electron')
const CharacterView = require('./character-view.js')
const BattleView = require('./battle-view.js')
const ValuesViewAverage = require('./values-view-average.js')
const ValuesViewDots = require('./values-view-dots.js')
const ValuesViewNone = require('./values-view-none.js')
const ValuesViewBattleCounts = require('./values-view-battle-counts.js')
const BattlePairer = require('../battle-pairer.js')

var valuesLib
var characters
var valuesMap = {} // key: valueID, value: value data
var characterValues = {} // key: character ID, value: array of their values with scores
var battlePairers = {} // cache battle pairers
var characterBattlePairs = {}
var currentCharacterID
var valuesViewType = "none"
var knex = remote.getGlobal('knex')
var valuesContainer = document.getElementById("values-container")
var container = document.getElementById("container")

// Cache the system values
knex.select().table('Values')
  .then(values => {
    let end = Date.now()
    valuesLib = values
    for(let value of valuesLib) {
      valuesMap[value.id.toString()] = value
    }
    remote.valuesMap = valuesMap
  })

document.querySelector("#values-view-selector").addEventListener('change', (event)=>{
  valuesViewType = event.target.value
  onSelectCharacter(currentCharacterID)
})

var characterView = new CharacterView({"characters": getCharacters()})
var existingCharacterView = document.getElementById("characters-container")
container.replaceChild(characterView.getView(), existingCharacterView)
characterView.on('select-character', data => onSelectCharacter(data.characterID))
characterView.on('add-character', data => {
  let record = data
  knex('Characters').returning('id').insert(record)
    .then((result) => {
      let newID = result && result[0]
      record.id = newID
      characters.push(record)
      characterView.updateView()
      
      let newCharacterValueInserts = valuesLib.map((value)=>{
        knex('CharacterValues').insert({characterID: newID, valueID: value.id, score: 0.0, wins: 0, losses: 0, battleCount: 0})
          .then(()=>{})
          .catch(console.error)
      })
      Promise.all(newCharacterValueInserts)
        .then(()=>{ onSelectCharacter(newID) })
        .catch(console.error)
    })
    .catch(console.error)
})

function onSelectCharacter(characterID) {
  currentCharacterID = characterID
  let character
  for(let aCharacter of characters) { 
    if(aCharacter.id === currentCharacterID) {
      character = aCharacter
      break
    }
  }

  let battleView = new BattleView({ character: character, battlePairer: getBattlePairer(characterID)})
  let existing = document.getElementById("battle-container")
  container.replaceChild(battleView.getView(), existing)
  
  document.getElementById("values-header").innerHTML = `${character.name}'s Values`
  document.getElementById("values-view").innerHTML = ''
  
  let ValuesView = getValuesView()
  let valuesView = new ValuesView({ valuesMap: valuesMap, values: getCharacterValues(currentCharacterID), battlePairer: getBattlePairer(characterID) })
  let existingValuesView = document.getElementById("values-view")
  valuesContainer.replaceChild(valuesView.getView(), existingValuesView)
  
  battleView.on('battle-update', battleOutcome => {
    let curCharacterValues = characterValues[battleOutcome.characterID]
    let isWinnerUpdated, isLoserUpdated
    let tailPromises = []
    for(let curCharacterValue of curCharacterValues) {
      if(curCharacterValue.valueID == battleOutcome.winner) {
        curCharacterValue.wins += 1
        curCharacterValue.battleCount = curCharacterValue.wins + curCharacterValue.losses
        curCharacterValue.score = curCharacterValue.wins / (curCharacterValue.wins + curCharacterValue.losses)
        tailPromises.push(knex('CharacterValues').where({id: curCharacterValue.id}).update(curCharacterValue))
        isWinnerUpdated = true
      } else if(curCharacterValue.valueID == battleOutcome.loser) {
        curCharacterValue.losses += 1
        curCharacterValue.battleCount = curCharacterValue.wins + curCharacterValue.losses
        curCharacterValue.score = curCharacterValue.wins / (curCharacterValue.wins + curCharacterValue.losses)
        tailPromises.push(knex('CharacterValues').where({id: curCharacterValue.id}).update(curCharacterValue))
        isLoserUpdated = true
      }
      if(isWinnerUpdated && isLoserUpdated) {
        break
      }
    }
    curCharacterValues.sort((a, b) => {
      if(a.score === b.score) {
        return b.battleCount - a.battleCount
      }
      return b.score - a.score
    })

    updateBattlePairs(battleOutcome)
    battlePairers[battleOutcome.characterID].onBattleOutcome(battleOutcome)
    valuesView.onBattleOutcome(battleOutcome)

    tailPromises.push(knex('ValuesBattleOutcomes').insert(battleOutcome))
    setImmediate(()=>{
      Promise.all(tailPromises)
        .then(()=> {})
        .catch(console.error)
    })
  })
}

function getValuesView() {
  switch(valuesViewType) {
    case "none":
      return ValuesViewNone
    case "dots":
      return ValuesViewDots
    case "battleCounts":
      return ValuesViewBattleCounts
    case "average":
    default:
      return ValuesViewAverage
  }
}

function getCharacterValues(characterID) {
  characterID = characterID.toString()
  if(characterValues[characterID]) {
    return Promise.resolve(characterValues[characterID])
  } else {
    return new Promise((resolve, reject) => {
      knex('CharacterValues').where({characterID: characterID}).orderBy('score', 'desc').orderBy('battleCount', 'desc')
        .then(queryResult => {
          let result = JSON.parse(JSON.stringify(queryResult))
          resolve(result)
          characterValues[characterID] = result
        })
        .catch(console.error)
    })
  }
}

function getCharacters() {
  if(characters) {
    return Promise.resolve(characters)
  } else {
    return new Promise((resolve, reject)=>{
      knex.select().table('Characters')
        .then(result => {
          characters = result
          resolve(characters)
        })
        .catch(reject)
    })
  }
}

function getBattlePairer(characterID) {
  if(!battlePairers[characterID]) {
    let properties = {
      choices: valuesLib, 
      characterID: characterID, 
      values:getCharacterValues(characterID), 
      valuesMap: valuesMap,
      battlePairs: getCharacterBattlePairs(characterID)
    }
    let battlePairer = new BattlePairer(properties)
    battlePairers[characterID] = battlePairer
  }

  return battlePairers[characterID]
}

function getCharacterBattlePairs(characterID) {
  if(characterBattlePairs[characterID]) {
    return Promise.resolve(characterBattlePairs[characterID])
  } else {
    return new Promise((fulfill, reject) => {
      knex('ValuesBattleOutcomes').select().where({characterID: characterID})
      .then(battleOutcomes => {
        if(!battleOutcomes || battleOutcomes.length < 1) {
          characterBattlePairs[characterID] = {}
        }
        for(let battleOutcome of battleOutcomes) {
          updateBattlePairs(battleOutcome)
        }
        // console.log(JSON.stringify(battlePairs, null, 2))
        fulfill(characterBattlePairs[characterID])
      })
      .catch(console.error)
    })
  }
}

function updateBattlePairs(battleOutcome) {
  if(!characterBattlePairs.hasOwnProperty(battleOutcome.characterID)) {
    characterBattlePairs[battleOutcome.characterID] = {}
  }
  let battlePairs = characterBattlePairs[battleOutcome.characterID]
  if(!battlePairs.hasOwnProperty(battleOutcome.winner)) {
    battlePairs[battleOutcome.winner] = {}
  }
  let winnerPairs = battlePairs[battleOutcome.winner]
  if(!winnerPairs.hasOwnProperty(battleOutcome.loser)) {
    winnerPairs[battleOutcome.loser] = 0
  }
  winnerPairs[battleOutcome.loser] += 1
}