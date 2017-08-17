const {remote} = require('electron')

let knex = remote.getGlobal('knex')
knex.select().table('Characters')
  .then(characters => {
    for(let character of characters) {
      addCharacter(character.name, character.id)
    }
    
  })

var valuesLib

knex.select().table('Values')
.then(values => {
  console.log(values)
  valuesLib = values
})

document.querySelector("#character-input-add-button").addEventListener('click', addCharacterFronInput)
document.querySelector("#character-input-add-button").addEventListener('click', showCharacterValues)

document.querySelector("#input-add-character-name").addEventListener('keydown', (event)=>{
  if(event.keyCode === 13) {
    addCharacterFronInput()
  }
})

var addCharacterFronInput = (event)=>{
  let newNameInput = document.querySelector("#input-add-character-name")
  let newName = newNameInput.value
  addCharacter(newName, 13371337)
  if(newName) {
    knex.insert({name: newName}).into('Characters')
      .then(() => {
        // unfortunately, it looks like sqlite doesn't return the new record, so we have to fetch it to get the new id
        knex.select().table('Characters').where({name: newName})
          .then(newCharacters => {
            let newCharacter = newCharacters && newCharacters.length && newCharacters[0]
            for(let value of valuesLib) {
              knex('CharacterValues').insert({characterID: newCharacter.id, valueID: value.id, score: 0.0})
                .then(()=>{
                  // update the dom with the new id.
                  let newNode = document.querySelectorAll("[data-id='13371337']")[0]
                  if(newNode) {
                    newNode.dataset.id = newCharacter.id
                  }
                })
                .catch(console.error)
            }
          })
      })
    
    newNameInput.value = ""
  }
}

function addCharacter(characterName, characterID) {
  let characterView = document.createElement('div')
  characterView.setAttribute("class", "character-list-name")
  characterView.setAttribute("data-id", characterID || 1)
  characterView.innerHTML = characterName
  characterView.addEventListener('click', showCharacterValues);
  document.querySelector("#character-list").appendChild(characterView)
}

function showCharacterValues(event) {
  let characterID = event.target.dataset.id
  document.querySelector("#value-list").innerHTML = ''
  knex.select().from('CharacterValues').leftJoin('Values', 'CharacterValues.valueID', 'Values.id').where({characterID: characterID})
      .then(characterValues => {
        for(let characterValue of characterValues) {
          addValue(characterValue.name, characterValue.score)
        }
      })
      .catch(console.error)
}

function addValue(valueName, valueScore) {
  let valueView = document.createElement('div')
  valueView.setAttribute("class", "value-list-name")
  valueView.innerHTML = `Name: ${valueName} | Score: ${valueScore}`
  document.querySelector("#value-list").appendChild(valueView)
}