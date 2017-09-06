const {remote} = require('electron')
const CharacterTrainerView = require('./character-trainer-view.js')
const CharacterComparisonView = require('./character-comparison-view.js')
const MainViewSelector = require('./main-view-selector.js')

const BattlePairer = require('../battle-pairer.js')

var valuesLib
var characters
var valuesMap = {} // key: valueID, value: value data
var characterValues = {} // key: character ID, value: array of their values with scores
var battlePairers = {} // cache battle pairers
var characterBattlePairs = {}
var currentCharacterID
var knex = remote.getGlobal('knex')
var container = document.getElementById("container")
var curViewType = "characterTrainer"
var currentContentView

// Cache the system values
knex.select().table('Values')
  .then(values => {
    values = JSON.parse(JSON.stringify(values))
    let end = Date.now()
    valuesLib = values
    for(let value of valuesLib) {
      valuesMap[value.id.toString()] = value
    }
    remote.valuesMap = valuesMap
  })

function getContentView() {
  switch(curViewType) {
    case "characterComparison":
     return CharacterComparisonView
    case "characterTrainer":
    default:
      return CharacterTrainerView
  }
}

const viewProperties = {
  "getBattlePairer": getBattlePairer,
  "getCharacterValues": getCharacterValues,
  "getCharacters": getCharacters,
  "valuesMap": valuesMap
}

var mainViewSelector = new MainViewSelector()
document.getElementById("navigation").appendChild(mainViewSelector.getView())
mainViewSelector.on('select-view', viewType => {
  console.log(viewType)
  curViewType = viewType
  onSelectView()
})

function onSelectView() {
  var ContentView = getContentView()
  currentContentView = new ContentView(viewProperties)
  document.getElementById("content-container").innerHTML = ``
  document.getElementById("content-container").appendChild(currentContentView.getView())
  currentContentView.on('battle-update', battleOutcome => {
    handleBattleUpdate(battleOutcome)
  })
  currentContentView.on('add-character', data => {
    addCharacter(data)
  })
}

function updateView() {
  currentContentView.updateView()
}

function addCharacter(record) {
  knex('Characters').returning('id').insert(record)
    .then((result) => {
      let newID = result && result[0]
      record.id = newID
      characters.push(record)
      
      let newCharacterValueInserts = valuesLib.map((value)=>{
        knex('CharacterValues').insert({characterID: newID, valueID: value.id, score: 0.0, wins: 0, losses: 0, battleCount: 0})
          .then(()=>{})
          .catch(console.error)
      })
      Promise.all(newCharacterValueInserts)
        .then(()=>{ 
          if(currentContentView && typeof currentContentView.onSelectCharacter === "function") {
            currentContentView.onSelectCharacter(newID) 
          }
        })
        .catch(console.error)
    })
    .catch(console.error)
}

function handleBattleUpdate(battleOutcome) {
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

  tailPromises.push(knex('ValuesBattleOutcomes').insert(battleOutcome))
  setImmediate(()=>{
    Promise.all(tailPromises)
      .then(()=> {})
      .catch(console.error)
  })
}

function getCharacterValues(characterID) {
  characterID = characterID.toString()
  if(characterValues[characterID]) {
    return Promise.resolve(characterValues[characterID])
  } else {
    return new Promise((resolve, reject) => {
      knex.raw(`select * from CharacterValues where "characterID" = ?`, [characterID])
        .then(queryResult => {
          queryResult = JSON.parse(JSON.stringify(queryResult))
          let result = queryResult.sort((a, b)=>{
            if(a.score === b.score) {
              return b.battleCount - a.battleCount
            }
            return b.score - a.score
          })
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
          characters = JSON.parse(JSON.stringify(result))
          characters = result
          resolve(characters)
        })
        .catch(reject)
    })
  }
}

function getBattlePairer(characterID) {
  if(battlePairers[characterID]) {
    return Promise.resolve(battlePairers[characterID])
  } else {
    return new Promise((fulfill, reject) =>{
      getCharacterValues(characterID).then(characterValues => {
        getCharacterBattlePairs(characterID).then(characterBattlePairs => {
          let properties = {
            choices: valuesLib, 
            characterID: characterID, 
            values:characterValues,
            valuesMap: valuesMap,
            battlePairs: characterBattlePairs
          }
          let battlePairer = new BattlePairer(properties)
          battlePairers[characterID] = battlePairer
          fulfill(battlePairers[characterID])
        })
      })
    })
  }

  return battlePairers[characterID]
}

function getCharacterBattlePairs(characterID) {
  if(characterBattlePairs[characterID]) {
    return Promise.resolve(characterBattlePairs[characterID])
  } else {
    return new Promise((fulfill, reject) => {
      let start = Date.now()
      knex.raw(`select * from ValuesBattleOutcomes where "characterID" = ?`, [characterID])
        .then((result) => {
          if(!result || result.length < 1 || !characterBattlePairs[characterID]) {
            characterBattlePairs[characterID] = {}
          }
          for(let battleOutcome of result) {
            updateBattlePairs(battleOutcome)
          }
          fulfill(characterBattlePairs[characterID])
        })
        .catch(console.error)
    })
  }
}

function updateBattlePairs(battleOutcome) {
  if(!characterBattlePairs[battleOutcome.characterID]) {
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