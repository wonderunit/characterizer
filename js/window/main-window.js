const {remote} = require('electron')
const BattleView = require('./battle-view.js')
const ValuesViewAverage = require('./values-view-average.js')
const CharacterValue = require('../model/character-value.js')

var valuesLib
var characters = []
var valuesMap = {}
var characterValues = {} // key: character ID, value: array of their values with scores

let knex = remote.getGlobal('knex')

// set up the characters
knex.select().table('Characters')
  .then(result => {
    characters = result
    for(let character of characters) {
      addCharacterView(character.name, character.id)

      // set up a cache of current character values
      // knex.select().table('CharacterValues').where({characterID: character.id})
      //   .then(characterValuesData => {
      //     let characterValuesResult = []
      //     for(let characterValueData of characterValuesData) {
      //       characterValuesResult.push(new CharacterValue(characterValueData, valuesMap[characterValueData.valueID.toString()]))
      //     }
      //     characterValues[character.id.toString()] = characterValuesResult
      //   })
      //   .catch(console.error)
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
          knex('CharacterValues').insert({characterID: newID, valueID: value.id, score: 0.0})
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
  let characterID = parseInt(event.target.dataset.id)

  let character
  for(let aCharacter of characters) { 
    if(aCharacter.id === characterID) {
      character = aCharacter
      break
    }
  }
  let battleView = new BattleView({ choices: valuesLib, character: character})
  let existing = document.getElementById("battle-container")
  container.replaceChild(battleView.getView(), existing)
  
  document.getElementById("values-header").innerHTML = `${character.name}'s Values`
  document.getElementById("values-view").innerHTML = ''
  
  let valuesView = new ValuesViewAverage({ character: character, valuesMap: valuesMap, values: characterValues[characterID]})
  let existingValuesView = document.getElementById("values-view")
  valuesContainer.replaceChild(valuesView.getView(), existingValuesView)
  
  battleView.on('battle-update', battleOutcome => {
    valuesView.onBattleOutcome(battleOutcome)
    let cv = characterValues[battleOutcome.characterID]
    if(cv) {
      for(let v of cv) {
        if(v.valueID == battleOutcome.winner || v.valueID == battleOutcome.loser) {
          v.updateWithBattleOutcome(battleOutcome)
        }
      }
    }
  })
}
