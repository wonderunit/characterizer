const MainBaseView = require('./main-base-view.js')
const FavoriteButton = require('./favorite-button.js')
const BattleTimeKeeper = require('../battle-timekeeper.js')
const { getFriendlyMS } = require('../utils.js')
const prefsModule = require('electron').remote.require('./js/prefs')
const EXPIRE_TIME = prefsModule.getPrefs()['skipTimerLength'] || 10*1000

module.exports = class CharacterTrainerView extends MainBaseView {
  constructor(properties) {
    super(properties)
    this.showTimer = true

    this.root.setAttribute("id", "character-trainer-container")
    this.root.addEventListener('keypress', this.onKeyPress.bind(this))

    this.header = document.createElement("h2")
    this.header.setAttribute("id", "character-trainer-view-header")
    this.root.appendChild(this.header)

    this.characterSelector = document.createElement("select")
    this.characterSelector.classList.add("character-trainer-view-character-selector")
    this.characterSelector.addEventListener('change', (event)=>{
      this.currentCharacterID = parseInt(event.target.value)
      this.onSelectCharacter(this.currentCharacterID)
    })
    this.header.appendChild(this.characterSelector)
    let chooses = document.createElement("div")
    chooses.setAttribute("id", "character-trainer-view-header-text")
    chooses.innerHTML = `faces a difficult choice...`
    this.header.appendChild(chooses)

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
    this.battleView.setAttribute("id", "character-trainer-view-battle-container")
    this.battleView.setAttribute("tabindex", 1)
    this.root.appendChild(this.battleView)

    this.buttonContainer = document.createElement("div")
    this.buttonContainer.setAttribute("id", "battle-view-button-container")
    this.root.appendChild(this.buttonContainer)

    this.skipButton = document.createElement("div")
    this.skipButton.setAttribute("class", "battle-view-button")
    this.skipButton.addEventListener('click', this.onSkip.bind(this))
    this.skipButton.innerHTML = `Skip`
    this.buttonContainer.appendChild(this.skipButton)

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
    this.sessionTimeView.setAttribute("id", "session-time-view")
    this.sessionView.appendChild(this.sessionTimeView)
    this.footerView.appendChild(this.sessionView)

    let battleTypeView = document.createElement("div")
    this.battleTypeView = battleTypeView
    this.battleTypeView.classList.add("battle-type-view")
    this.footerView.appendChild(this.battleTypeView)

    this.showTimerSwitch = document.createElement("div")
    this.showTimerSwitch.setAttribute("id", "battle-view-show-timer")
    this.showTimerSwitch.setAttribute("class", "battle-view-button")
    this.showTimerSwitch.innerHTML = "Hide Timer"
    this.showTimerSwitch.addEventListener("click", this.toggleTimerView.bind(this))
    this.footerView.appendChild(this.showTimerSwitch)

    this.characterSessionStartTime = Date.now()
  }

  setupBattleView() {
    this.getBattlePairer(this.currentCharacterID).then(battlePairer =>{
      this.battleView.innerHTML = ``

      this.battlePairer = battlePairer
  
      this.choiceContainer1 = document.createElement("div")
      this.choiceContainer1.classList.add("battle-view-choice-button")
      this.choiceContainer1.addEventListener('click', this.onChoiceClick.bind(this))
      this.battleView.appendChild(this.choiceContainer1)

      this.centerContainer = document.createElement("div")
      this.centerContainer.setAttribute("id", "character-trainer-view-center-container")

      this.favoriteButton = new FavoriteButton({handler: this.onFavorite.bind(this)})
      this.centerContainer.appendChild(this.favoriteButton.getView())

      let centerText = document.createElement("div")
      centerText.setAttribute("id", "character-trainer-view-center-text")
      centerText.innerHTML = `or`
      this.centerContainer.appendChild(centerText)
  
      this.timerContainer = document.createElement("div")
      this.timerContainer.setAttribute("id", "battle-view-timer-container")
      this.timerContainer.classList.add("battle-view-timer-container")
      this.countdownTimer = document.createElement("div")
      this.countdownTimer.classList.add("countdown-progress-bar")
      this.timerContainer.appendChild(this.countdownTimer)
      this.centerContainer.appendChild(this.timerContainer)

      this.battleView.appendChild(this.centerContainer)

      this.choiceContainer2 = document.createElement("div")
      this.choiceContainer2.classList.add("battle-view-choice-button")
      this.choiceContainer2.addEventListener('click', this.onChoiceClick.bind(this))
      this.battleView.appendChild(this.choiceContainer2)
  
      this.battlePaiererTypeHandler = (battleType)=>{
        this.battleTypeView.innerHTML = battleType
      }
      this.battlePairer.on("battle-type-try", this.battlePaiererTypeHandler)
  
      this.setupBattle()
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
    if(this.characterSessionStartTime && this.showTimer) {
      this.startSessionTimerView()
      this.sessionCountView.innerHTML = `${session.battleCount} Questions in `
    } else {
      this.sessionTimeView.innerHTML = ``
      this.sessionCountView.innerHTML = `${session.battleCount} Questions`
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
      this.sessionTimeView.innerHTML = `${elapsed.h ? elapsed.h+':' : ''}${elapsed.m}:${elapsed.s}`
  }

  clearSessionTimer() {
    if(this.timerID) {
      clearInterval(this.timerID)
      this.timerID = null
      this.sessionTimeView.innerHTML = ``
    }
  }

  viewWillDisappear() {
    this.clearBattleTimer()
    this.battlePairer.removeListener("battle-type-try", this.battlePaiererTypeHandler)

    if(this.timerID) {
      clearInterval(this.timerID)
      this.timerID = null
    }
  }

  setupBattle() {
    this.clearBattleTimer()
    this.favoriteButton.innerHTML = `Favorite`

    this.choiceContainer1.innerHTML = ""
    this.choiceContainer2.innerHTML = ""
    let battleData = this.battlePairer.getBattle()

    this.choiceDataOne = battleData[0]
    this.choiceContainer1.setAttribute("data-id", this.choiceDataOne.id)
    this.choiceContainer1.innerHTML = this.choiceDataOne.name

    this.choiceDataTwo = battleData[1]
    this.choiceContainer2.setAttribute("data-id", this.choiceDataTwo.id)
    this.choiceContainer2.innerHTML = this.choiceDataTwo.name

    if(this.showTimer) {
      this.startBattleTimerView()
    }

    this.emit('battle-start', battleData)
    this.curBattleTimeKeeper.onBattleStart()
  }

  onChoiceClick(event) {
    let winnerID = parseInt(event.target.dataset.id)
    this.handleChoice(winnerID)
  }

  handleChoice(winnerID) {
    let winner, loser
    let battleOutcome = {
      characterID: this.character.id
    }
    if(winnerID === this.choiceDataOne.id) {
      battleOutcome.winner = this.choiceDataOne.id
      battleOutcome.loser = this.choiceDataTwo.id
    } else {
      battleOutcome.winner = this.choiceDataTwo.id
      battleOutcome.loser = this.choiceDataOne.id
    }
    this.emit('battle-update', battleOutcome)
    this.setupBattle()
    this.curBattleTimeKeeper.onBattleOutcome(battleOutcome)
    this.updateView()
  }

  onKeyPress(event) {
    if(event.key == "1") {
      this.handleChoice(this.choiceDataOne.id)
    }
    if(event.key == "2") {
      this.handleChoice(this.choiceDataTwo.id)
    }
  }

  onSkip(event) {
    this.emit('battle-skip')
    this.setupBattle()
  }

  onFavorite(event) {
    this.emit('battle-favorite', {value1: this.choiceDataOne, value2: this.choiceDataTwo, character: this.character})
    this.setupBattle()
  }

  clearBattleTimer() {
    if(this.battleTimerID) {
      clearInterval(this.battleTimerID)
      this.battleTimerID = null
    }
  }

  startBattleTimerView() {
    this.battleStartTime = Date.now()
    this.battleTimerID = setInterval(() => {
      let now = Date.now()
      let elapsed = now - this.battleStartTime
      if(elapsed > (EXPIRE_TIME)) {
        this.onSkip()
      }
      this.countdownTimer.setAttribute("style", `width: ${((EXPIRE_TIME-elapsed)/EXPIRE_TIME)*100}%`)
    }, 1000/120)
  }

  toggleTimerView(event) {

    let session = this.getCharacterSession(this.character.id)
    this.showTimer = !this.showTimer
    if(this.showTimer) {
      this.showTimerSwitch.innerHTML = "Hide Timer"
      this.timerContainer.classList.remove("hidden")
      this.clearBattleTimer()
      this.startBattleTimerView()
      this.emit("show-timer")
      this.startSessionTimerView()
      this.sessionCountView.innerHTML = `${session.battleCount} Questions in `
    } else {
      this.showTimerSwitch.innerHTML = "Show Timer"
      this.timerContainer.classList.add("hidden")
      this.clearBattleTimer()
      this.emit("hide-timer")
      this.clearSessionTimer()
      this.sessionCountView.innerHTML = `${session.battleCount} Questions`
    }
  } 
}