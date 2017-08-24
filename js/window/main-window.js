const {remote} = require('electron')
const BattleView = require('./battle-view.js')
const ValuesViewAverage = require('./values-view-average.js')
const ValuesViewDots = require('./values-view-dots.js')

var valuesLib
var characters = []
var valuesMap = {}
var characterValues = {} // key: character ID, value: array of their values with scores
var currentCharacterID
var valuesViewType = "average"
let knex = remote.getGlobal('knex')


// set up the characters
knex.select().table('Characters')
  .then(result => {
    characters = result
    for(let character of characters) {
      addCharacterView(character.name, character.id)
    }
  })

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
var charactersContainer = document.querySelector("#characters-container")
var valuesContainer = document.getElementById("values-container")

document.querySelector("#character-input-add-button").addEventListener('click', addCharacterFronInput)
document.querySelector("#values-view-selector").addEventListener('change', (event)=>{
  valuesViewType = event.target.value
  showCharacterView(currentCharacterID)
})

document.querySelector("#input-add-character-name").addEventListener('keydown', (event)=>{
  if(event.keyCode === 13) {
    addCharacterFronInput()
  }
})

var addCharacterFronInput = (event)=>{
  let newNameInput = document.querySelector("#input-add-character-name")
  let newName = newNameInput.value
  addCharacterView(newName, 13371337)
  if(newName) {
    let record = {name: newName}
    knex('Characters').returning('id').insert(record)
      .then((result) => {
        let newID = result && result[0]
        record.id = newID
        characters.push(record)
        let newNode = document.querySelectorAll("[data-id='13371337']")[0]
        if(newNode) {
          newNode.dataset.id = newID
        }
        let newCharacterValueInserts = valuesLib.map((value)=>{
          knex('CharacterValues').insert({characterID: newID, valueID: value.id, score: 0.0, wins: 0, losses: 0})
            .then(()=>{})
            .catch(console.error)
        })
        Promise.all(newCharacterValueInserts)
          .then(()=>{})
          .catch(console.error)
      })
      .catch(console.error)
    
    newNameInput.value = ""
  }
}

function addCharacterView(characterName, characterID) {
  let characterView = document.createElement('div')
  characterView.setAttribute("class", "character-list-name")
  characterView.setAttribute("data-id", characterID || 1)
  characterView.innerHTML = characterName
  characterView.addEventListener('click', onSelectCharacter);
  document.querySelector("#character-list").appendChild(characterView)
}

function onSelectCharacter(event) {
  showCharacterView(parseInt(event.target.dataset.id))
}

function showCharacterView(characterID) {
  currentCharacterID = characterID
  let character
  for(let aCharacter of characters) { 
    if(aCharacter.id === currentCharacterID) {
      character = aCharacter
      break
    }
  }

  let battleView = new BattleView({ choices: valuesLib, character: character})
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
        curCharacterValue.score = curCharacterValue.wins / (curCharacterValue.wins + curCharacterValue.losses)
        knex('CharacterValues').where({id: curCharacterValue.id}).update(curCharacterValue)
          .then(()=>{})
          .catch(console.error)
        isWinnerUpdated = true
      } else if(curCharacterValue.valueID == battleOutcome.loser) {
        curCharacterValue.losses += 1
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
    curCharacterValues.sort((a, b) => {return b.score - a.score})
    valuesView.onBattleOutcome(battleOutcome)
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
      knex('CharacterValues').where({characterID: characterID})
        .then(queryResult => {
          queryResult = queryResult.sort((a, b) => {return b.score - a.score})
          resolve(queryResult)
          characterValues[characterID] = queryResult
        })
        .catch(console.error)
    })
  }
}
