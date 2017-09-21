const {remote} = require('electron')
const CharacterView = require('./character-view.js')
const CharacterTrainerView = require('./character-trainer-view.js')
const ValueListView = require('./value-list-view.js')
const CharacterComparisonView = require('./character-comparison-view.js')
const CharacterComparisonConflictView = require('./character-comparison-conflict-view.js')
const BattleFavoritesView = require('./battle-favorites-view.js')
const MainViewSelector = require('./main-view-selector.js')

const BattlePairer = require('../battle-pairer.js')

const mainViews = [
  {
    "type": "manageCharacters",
    "label": "Manage Characters"
  },
  {
    "type": "characterTrainer",
    "label": "Value Training"
  },
  {
    "type": "valueList",
    "label": "Value List"
  },
  {
    "type": "characterComparison",
    "label": "Character Comparison"
  },
  {
    "type": "battleFavorites",
    "label": "Battle Favorites"
  },
  {
    "type": "characterConflictComparison",
    "label": "Conflict Comparison"
  }
]

var valuesLib
var characters
var valuesMap = {} // key: valueID, value: value data
var characterValues = {} // key: character ID, value: array of their values with scores
var battlePairers = {} // cache battle pairers

// objects of the form { winnerID: { loserID: count }, ... },
// keyed by character id
var characterBattlePairs = {} 
var characterBattleCounts = {}
var characterSessions = {}
var characterValueFavorites = {}
var currentCharacterID
var knex = remote.getGlobal('knex')
var container = document.getElementById("container")
var curViewType = ""
var currentContentView

const viewProperties = {
  "getBattlePairer": getBattlePairer,
  "getCharacterValues": getCharacterValues,
  "getCharacters": getCharacters,
  "getCharacterBattleCount": getCharacterBattleCount,
  "getCharacterSession": getCharacterSession,
  "getCharacterValueFavorites": getCharacterValueFavorites,
  "valuesMap": valuesMap
}

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

var mainViewSelector = new MainViewSelector({type: curViewType, mainViews: mainViews})
document.getElementById("navigation").appendChild(mainViewSelector.getView())
mainViewSelector.on('select-view', viewType => {
  console.log(viewType)
  curViewType = viewType
  onSelectView()
})

getCharacters()
  .then(characters => {
    if(characters && characters.length) {
      curViewType = "characterTrainer"
    }
    onSelectView()
  })

/**
 * Switch 
 */
function onSelectView() {
  if(currentContentView) {
    currentContentView.viewWillDisappear()
  }
  var ContentView = getContentView()
  currentContentView = new ContentView(viewProperties)
  document.getElementById("content-container").innerHTML = ``
  document.getElementById("content-container").appendChild(currentContentView.getView())
  currentContentView.on('battle-update', battleOutcome => {
    handleBattleUpdate(battleOutcome)
  })
  currentContentView.on('battle-favorite', battleData => {
    updateCharacterBattleFavorites(battleData)
  })
  currentContentView.on('add-character', data => {
    addCharacter(data)
  })
}

/**
 * @return The class for the currently selected main view.
 */
function getContentView() {
  switch(curViewType) {
    case "characterComparison":
     return CharacterComparisonView
    case "valueList":
      return ValueListView
    case "battleFavorites":
      return BattleFavoritesView
    case "characterTrainer":
      return CharacterTrainerView
    case "characterConflictComparison":
      return CharacterComparisonConflictView
    case "manageCharacters":
    default:
      return CharacterView
  }
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
          updateView()
          if(currentContentView && typeof currentContentView.onSelectCharacter === "function") {
            currentContentView.onSelectCharacter(newID) 
          }
        })
        .catch(console.error)
    })
    .catch(console.error)
}

/**
 * 
 * @param {Object} battleOutcome 
 */
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

  let characterSession = getCharacterSession(battleOutcome.characterID)
  characterSessions[battleOutcome.characterID].battleCount += 1
  if(!characterSessions[battleOutcome.characterID].battleStart) {
    characterSessions[battleOutcome.characterID].battleStart = Date.now()
  }

  if(currentContentView && typeof currentContentView.handleBattleUpdate === 'function') {
    currentContentView.handleBattleUpdate(battleOutcome)
  }

  tailPromises.push(knex('ValuesBattleOutcomes').insert(battleOutcome))
  setImmediate(()=>{
    Promise.all(tailPromises)
      .then(()=> {})
      .catch(console.error)
  })
}

/**
 * 
 * @param {String} characterID 
 */
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

/**
 * @return array of characters
 */
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

/**
 * 
 * @param {Number} characterID 
 */
function getBattlePairer(characterID) {
  if(battlePairers[characterID]) {
    return Promise.resolve(battlePairers[characterID])
  } else {
    return new Promise((fulfill, reject) =>{
      getCharacterValues(characterID).then(characterValues => {
        getCharacterBattlePairs(characterID).then(characterBattlePairs => {
          getCharacterValueFavorites(characterID).then(favorites =>{
            let properties = {
              choices: valuesLib, 
              characterID: characterID, 
              values:characterValues,
              valuesMap: valuesMap,
              favorites: favorites,
              battlePairs: characterBattlePairs
            }
            let battlePairer = new BattlePairer(properties)
            battlePairer.init()
              .then(()=>{
                battlePairers[characterID] = battlePairer
                fulfill(battlePairers[characterID])
              })
              .catch(console.error)
          })
        })
      })
    })
  }

  return battlePairers[characterID]
}


/**
 * 
 * @param {Number} characterID 
 * @return {Object} has the form objects of the form { winnerID: { loserID: count }, ... }
 */
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

/**
 * 
 * @param {Object} battleOutcome
 */
function updateBattlePairs(battleOutcome) {
  // update the pair count.
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

  // update the total count.
  if(!characterBattleCounts[battleOutcome.characterID]) {
    characterBattleCounts[battleOutcome.characterID] = 0
  }
  characterBattleCounts[battleOutcome.characterID] += 1
}

/**
 * 
 * @param {Number} characterID 
 * @return {Object} objects have the form { value1ID: { value2ID: true, value2ID: true }, value1ID: {value2ID: true } }
 */
function getCharacterValueFavorites(characterID) {
  if(characterValueFavorites[characterID]) {
    return Promise.resolve(characterValueFavorites[characterID])
  } else {
    return new Promise((fulfill, reject) => {
      let start = Date.now()
      knex.raw(`select * from ValuesBattleFavorites where "characterID" = ?`, [characterID])
        .then((result) => {
          if(!result) {
            result = []
          }
          if(!characterValueFavorites[characterID]) {
            characterValueFavorites[characterID] = {
              pairs: {},
              values: []
            }
          }
          let characterFavorites = characterValueFavorites[characterID]

          var favoritePairs = characterFavorites.pairs
          var favoriteValues = characterFavorites.values 
          for(let record of result) {
            
            if(!favoritePairs[record.value1]) {
              favoritePairs[record.value1] = {}
            }
            favoritePairs[record.value1][record.value2] = true

            if(favoriteValues.indexOf(record.value1) < 0) {
              favoriteValues.push(record.value1)
            }
            if(favoriteValues.indexOf(record.value2) < 0) {
              favoriteValues.push(record.value2)
            }
          }
          fulfill(characterValueFavorites[characterID])
        })
        .catch(console.error)
    })
  }
}

/**
 * Updates both the local cache and database of character battle favorites.
 * Note that this is a toggle. If the pair exists, it is deleted.
 * 
 * @param {Object} battleData has the shape { character: character, value1: value, value2: value }
 */
function updateCharacterBattleFavorites(battleData) {
  let record = {
    value1ID: battleData.value1.id,
    value2ID: battleData.value2.id,
    characterID: battleData.character.id
  }
  if(!characterValueFavorites[record.characterID]) {
    characterValueFavorites[record.characterID] = {
      pairs: {},
      values: []
    }
  }

  let battlePairs = characterValueFavorites[record.characterID].pairs
  let favoriteValues = characterValueFavorites[record.characterID].values
  let value1Pairs
  let value2Pairs
  if(battlePairs.hasOwnProperty(record.value1ID)) {
    value1Pairs = battlePairs[record.value1ID]
  }
  if(battlePairs.hasOwnProperty(record.value2ID)) {
    value2Pairs = battlePairs[record.value2ID]
  }

  function removeFromFavoriteValues(valueID) {
    let index = favoriteValues.indexOf(valueID)
    if(index >= 0) {
      favoriteValues.splice(index, 1)
    }
  }

  let replacements = [record.characterID, record.value1ID, record.value2ID]
  if(value1Pairs && value1Pairs.hasOwnProperty(record.value2ID)) {
    delete value1Pairs[record.value2ID]
    removeFromFavoriteValues(record.value1ID)
    removeFromFavoriteValues(record.value2ID)
    knex.raw(`delete from ValuesBattleFavorites where "characterID" = ? and "value1ID" = ? and "value2ID" = ?`, replacements)
      .then(()=>{})
      .catch(console.error)
  } else if(value2Pairs && value2Pairs.hasOwnProperty(record.value1ID)) {
    delete value2Pairs[record.value1ID]
    knex.raw(`delete from ValuesBattleFavorites where "characterID" = ? and "value2ID" = ? and "value1ID" = ?`, replacements)
      .then(()=>{})
      .catch(console.error)
    removeFromFavoriteValues(record.value1ID)
    removeFromFavoriteValues(record.value2ID)
  } else {
    if(!value1Pairs) {
      battlePairs[record.value1ID] = {}
    }
    battlePairs[record.value1ID][record.value2ID] = true

    if(favoriteValues.indexOf(record.value1ID) < 0) {
      favoriteValues.push(record.value1ID)
    }
    if(favoriteValues.indexOf(record.value2ID) < 0) {
      favoriteValues.push(record.value2ID)
    }

    knex('ValuesBattleFavorites').insert(record)
      .then(()=>{})
      .catch(console.error)
  }
}

/**
 * 
 * @param {Number} characterID 
 * @return {Number} Number of battles the character has been trained on.
 */
function getCharacterBattleCount(characterID) {
  if(!characterBattleCounts[characterID]) {
    characterBattleCounts[characterID] = 0
  }
  return characterBattleCounts[characterID]
}

/**
 * 
 * @param {Number} characterID 
 * @return {Object} Object of the shape { battleCount: count, battleStart: timestamp }
 */
function getCharacterSession(characterID) {
  if(!characterSessions[characterID]) {
    characterSessions[characterID] = {
      battleCount: 0,
      battleStart: 0
    }
  }
  return characterSessions[characterID]
}