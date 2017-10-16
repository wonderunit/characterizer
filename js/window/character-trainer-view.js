const MainBaseView = require('./main-base-view.js')
const BattleView = require('./battle-view.js')
const BattleTimeKeeper = require('../battle-timekeeper.js')
const { getFriendlyMS } = require('../utils.js')

module.exports = class CharacterTrainerView extends MainBaseView {
  constructor(properties) {
    super(properties)
    this.root.setAttribute("id", "character-trainer-container")

    this.characterSelector = document.createElement("select")
    this.characterSelector.setAttribute("id", "character-selector")
    this.characterSelector.addEventListener('change', (event)=>{
      this.currentCharacterID = parseInt(event.target.value)
      this.onSelectCharacter(this.currentCharacterID)
    })
    this.root.appendChild(this.characterSelector)

    let selectedCharacters = this.getSelectedCharacters()
    if(selectedCharacters.length > 0) {
      this.character = selectedCharacters[0]
    } 
    
    this.characters = []
    this.getCharacters()
      .then(inCharacters => {
        this.characterSelector.innerHTML = ``
        if(!inCharacters || !inCharacters.length) {
          return
        }
        
        if(!this.character) {
          this.character = inCharacters[0]
        }
        this.characters = inCharacters
        for(let character of this.characters) {
          let option = document.createElement("option")
          option.setAttribute("value", character.id)
          option.innerHTML = character.name
          if(this.character.id === character.id) {
            option.setAttribute("selected", true)
          }
          this.characterSelector.appendChild(option)
        }
        
        this.onSelectCharacter(this.character.id)
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

    this.characterSessionStartTime = Date.now()
  }

  setupBattleView() {
    this.getBattlePairer(this.currentCharacterID).then(battlePairer =>{
      this.getCharacterValues(this.currentCharacterID).then(characterValues =>{
        if(this.battleView && typeof this.battleView.removeAllListeners === 'function') {
          this.battleView.removeAllListeners()
        }
        this.battleView = new BattleView({ character: this.character, battlePairer: battlePairer})
        let existingBattleContainer = document.getElementById("battle-container")
        if(existingBattleContainer) {
          existingBattleContainer.innerHTML = ``
        }
        if(!existingBattleContainer) {
          return
        }
        this.root.replaceChild(this.battleView.getView(), existingBattleContainer)
        
        this.battleView.on('battle-update', battleOutcome => {
          this.emit('battle-update', battleOutcome)
        })
  
        this.battleView.on('battle-start', battleData => {
          this.emit('battle-start', battleData)
          this.curBattleTimeKeeper.onBattleStart()
        })
        
        this.battleView.on('battle-skip', () => {
          this.emit('battle-skip')
        })
        
        this.battleView.on('battle-favorite', (data) => {
          this.emit('battle-favorite', data)
        })

        this.battleView.on('hide-timer', () => {
          this.clearSessionTimer()
          this.sessionTimeView.innerHTML = ``
        })
        this.battleView.on('show-timer', () => {
          this.startSessionTimerView()
        })
  
        let end = Date.now()
      })
    })
  }

  onSelectCharacter(characterID) {
    this.clearSessionTimer()
    this.characterSessionStartTime = Date.now()
    this.curBattleTimeKeeper = new BattleTimeKeeper()
    this.currentCharacterID = characterID
    for(let aCharacter of this.characters) { 
      if(aCharacter.id === this.currentCharacterID) {
        this.character = aCharacter
        break
      }
    }
    this.setupBattleView()
    this.updateView()
  }

  handleBattleUpdate(battleOutcome) {
    this.curBattleTimeKeeper.onBattleOutcome(battleOutcome)
    this.updateView()
  }

  getView() {
    return this.root
  }

  updateView() {
    if(this.timerID) {
      clearInterval(this.timerID)
      this.timerID = null
    }

    this.battleCountView.innerHTML = `${this.character.name} // ${this.getCharacterBattleCount(this.character.id)} Questions`

    let session = this.getCharacterSession(this.character.id)
    this.sessionCountView.innerHTML = `${session.battleCount} Questions `
    if(this.characterSessionStartTime) {
      this.startSessionTimerView()
    } else {
      this.sessionTimeView.innerHTML = ``
    }
  }

  startSessionTimerView() {
    this.clearSessionTimer()
    this.timerID = setInterval( () => {
      this.updateTimerView()
    }, 500)
    this.updateTimerView()
  }

  updateTimerView() {
      let now = Date.now()
      let elapsed = getFriendlyMS(now - this.characterSessionStartTime)
      this.sessionTimeView.innerHTML = ` // ${elapsed.h ? elapsed.h+':' : ''}${elapsed.m}:${elapsed.s}`
  }

  clearSessionTimer() {
    if(this.timerID) {
      clearInterval(this.timerID)
      this.timerID = null
      this.sessionTimeView.innerHTML = ` // 00:00:00`
    }
  }

  viewWillDisappear() {
    if(typeof this.battleView.viewWillDisappear === 'function') {
      this.battleView.viewWillDisappear()
    }

    if(this.timerID) {
      clearInterval(this.timerID)
      this.timerID = null
    }
  }
}