const MainBaseView = require('./main-base-view.js')
const BattleView = require('./battle-view.js')
const BattleTimeKeeper = require('../battle-timekeeper.js')

module.exports = class CharacterTrainerView extends MainBaseView {
  constructor(properties) {
    super(properties)
    this.root = document.createElement("div")
    this.root.setAttribute("id", "character-trainer-container")

    this.characterSelector = document.createElement("select")
    this.characterSelector.setAttribute("id", "character-selector")
    this.characterSelector.addEventListener('change', (event)=>{
      this.currentCharacterID = parseInt(event.target.value)
      this.onSelectCharacter(this.currentCharacterID)
    })
    this.root.appendChild(this.characterSelector)
    
    this.characters = []
    this.getCharacters()
      .then(inCharacters => {
        this.characters = inCharacters
        this.updateView()
        if(this.characters && this.characters.length) {
          this.onSelectCharacter(this.characters[0].id)
        }
      })
      .catch(console.error)

    this.battleView = document.createElement("div")
    this.battleView.setAttribute("id", "battle-container")
    this.root.appendChild(this.battleView)
  }

  onSelectCharacter(characterID) {
    let start = Date.now()
    this.curBattleTimeKeeper = new BattleTimeKeeper()
    this.currentCharacterID = characterID
    let character
    for(let aCharacter of this.characters) { 
      if(aCharacter.id === this.currentCharacterID) {
        character = aCharacter
        break
      }
    }

    this.getBattlePairer(characterID).then(battlePairer =>{
      this.getCharacterValues(characterID).then(characterValues =>{
        let battleView = new BattleView({ character: character, battlePairer: battlePairer})
        let existing = document.getElementById("battle-container")
        this.root.replaceChild(battleView.getView(), existing)
        
        battleView.on('battle-update', battleOutcome => {
          this.handleBattleUpdate(battleOutcome)
        })
  
        battleView.on('battle-start', battleData => {
          this.curBattleTimeKeeper.onBattleStart()
        })
        
        battleView.on('battle-skip', () => {
        })
  
        let end = Date.now()
        console.log(`Character select: ${end - start}`)
      })
    })
  }

  handleBattleUpdate(battleOutcome) {
    this.emit('battle-update', battleOutcome)
    this.curBattleTimeKeeper.onBattleOutcome(battleOutcome)
  }

  getView() {
    return this.root
  }

  updateView() {
    this.characterSelector.innerHTML = ``
    for(let character of this.characters) {
      let option = document.createElement("option")
      option.setAttribute("value", character.id)
      option.innerHTML = character.name
      this.characterSelector.appendChild(option)
    }
  }
}