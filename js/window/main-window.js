const {remote} = require('electron')
const CharacterView = require('./character-view.js')
const BattleView = require('./battle-view.js')
const ValuesViewAverage = require('./values-view-average.js')
const ValuesViewDots = require('./values-view-dots.js')
const BattlePairer = require('../battle-pairer.js')

var valuesLib
var characters
var valuesMap = {}
var characterValues = {} // key: character ID, value: array of their values with scores
var battlePairers = {} // cache battle pairers
var currentCharacterID
var valuesViewType = "average"
var knex = remote.getGlobal('knex')
var valuesContainer = document.getElementById("values-container")

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

var container = document.getElementById("container")

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
  let valuesView = new ValuesView({ valuesMap: valuesMap, values: getCharacterValues(currentCharacterID)})
  let existingValuesView = document.getElementById("values-view")
  valuesContainer.replaceChild(valuesView.getView(), existingValuesView)
  
  battleView.on('battle-update', battleOutcome => {
    let curCharacterValues = characterValues[battleOutcome.characterID]
    let isWinnerUpdated, isLoserUpdated
    for(let curCharacterValue of curCharacterValues) {
      if(curCharacterValue.valueID == battleOutcome.winner) {
        curCharacterValue.wins += 1
        curCharacterValue.battleCount = curCharacterValue.wins + curCharacterValue.losses
        curCharacterValue.score = curCharacterValue.wins / (curCharacterValue.wins + curCharacterValue.losses)
        knex('CharacterValues').where({id: curCharacterValue.id}).update(curCharacterValue)
          .then(()=>{})
          .catch(console.error)
        isWinnerUpdated = true
      } else if(curCharacterValue.valueID == battleOutcome.loser) {
        curCharacterValue.losses += 1
        curCharacterValue.battleCount = curCharacterValue.wins + curCharacterValue.losses
        curCharacterValue.score = curCharacterValue.wins / (curCharacterValue.wins + curCharacterValue.losses)
        knex('CharacterValues').where({id: curCharacterValue.id}).update(curCharacterValue)
          .then(()=>{})
          .catch(console.error)
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
    valuesView.onBattleOutcome(battleOutcome)

    knex('ValuesBattleOutcomes').insert(battleOutcome)
      .then(result => {
        // console.log(JSON.stringify(battleOutcome, null, 2))
      })
      .catch(console.error)
  })
}

function getValuesView() {
  switch(valuesViewType) {
    case "dots":
      return ValuesViewDots
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
          resolve(queryResult)
          characterValues[characterID] = queryResult
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
    let battlePairer = new BattlePairer({choices: valuesLib, characterID: characterID, values:getCharacterValues(characterID)})
    battlePairers[characterID] = battlePairer
  }

  return battlePairers[characterID]
}
