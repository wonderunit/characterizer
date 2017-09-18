const MainBaseView = require('./main-base-view.js')
const BattleView = require('./battle-view.js')
const BattleTimeKeeper = require('../battle-timekeeper.js')
const { getFriendlyMS } = require('../utils.js')

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
        if(this.characters && this.characters.length) {
          this.onSelectCharacter(this.characters[0].id)
        }
        this.updateView()
      })
      .catch(console.error)

    this.battleView = document.createElement("div")
    this.battleView.setAttribute("id", "battle-container")
    this.root.appendChild(this.battleView)

    this.footerView = document.createElement("div")
    this.footerView.setAttribute("id", "value-list-footer")
    this.footerView.classList.add("footer")
    this.root.appendChild(this.footerView)

    this.battleCountView = document.createElement("div")
    this.battleCountView.setAttribute("id", "value-list-battle-count")
    this.footerView.appendChild(this.battleCountView)
    
    this.sessionView = document.createElement("div")
    this.sessionView.setAttribute("id", "value-list-session")
    this.sessionCountView = document.createElement("div")
    this.sessionView.appendChild(this.sessionCountView)
    this.sessionTimeView = document.createElement("div")
    this.sessionView.appendChild(this.sessionTimeView)
    this.footerView.appendChild(this.sessionView)
  }

  onSelectCharacter(characterID) {
    if(this.timerID) {
      clearInterval(this.timerID)
      this.timerID = null
    }

    let start = Date.now()
    this.curBattleTimeKeeper = new BattleTimeKeeper()
    this.currentCharacterID = characterID
    for(let aCharacter of this.characters) { 
      if(aCharacter.id === this.currentCharacterID) {
        this.character = aCharacter
        break
      }
    }

    this.getBattlePairer(characterID).then(battlePairer =>{
      this.getCharacterValues(characterID).then(characterValues =>{
        let battleView = new BattleView({ character: this.character, battlePairer: battlePairer})
        let existing = document.getElementById("battle-container")
        this.root.replaceChild(battleView.getView(), existing)
        
        battleView.on('battle-update', battleOutcome => {
          this.emit('battle-update', battleOutcome)
        })
  
        battleView.on('battle-start', battleData => {
          this.emit('battle-start', battleData)
          this.curBattleTimeKeeper.onBattleStart()
        })
        
        battleView.on('battle-skip', () => {
          this.emit('battle-skip')
        })
        
        battleView.on('battle-favorite', (data) => {
          this.emit('battle-favorite', data)
        })
  
        let end = Date.now()
        this.updateView()
        console.log(`Character select: ${end - start}`)
      })
    })
  }

  handleBattleUpdate(battleOutcome) {
    this.curBattleTimeKeeper.onBattleOutcome(battleOutcome)
    this.updateView()
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
      if(this.character.id === character.id) {
        option.setAttribute("selected", true)
      }
      this.characterSelector.appendChild(option)
    }
    
    this.battleCountView.innerHTML = `${this.character.name} // ${this.getCharacterBattleCount(this.character.id)} Questions`

    let session = this.getCharacterSession(this.character.id)
    this.sessionCountView.innerHTML = `${session.battleCount} Questions `
    if(session.battleStart) {
      if(!this.timerID) {
        this.characterSessionStartTime = session.battleStart
        this.startSessionTimerView()
      }
    } else {
      this.sessionTimeView.innerHTML = ``
    }
  }

  startSessionTimerView() {
    this.timerID = setInterval(() => {
      let now = Date.now()
      let elapsed = getFriendlyMS(now - this.characterSessionStartTime)

      this.sessionTimeView.innerHTML = ` // ${elapsed.h ? elapsed.h+':' : ''}${elapsed.m}:${elapsed.s}`
    }, 500)
  }
}