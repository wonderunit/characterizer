const EventEmitter = require('events').EventEmitter
const {remote} = require('electron')

let knex = remote.getGlobal('knex')

const EXPIRE_TIME = 10*1000

module.exports = class BattleView extends EventEmitter {
  constructor(properties) {
    super()
    this.showTimer = true

    if(!properties.character) throw new Error("Missing character")
    this.character = properties.character
    
    if(!properties.battlePairer) throw new Error("Missing battlePairer")
    this.battlePairer = properties.battlePairer
    this.battlePairer.on("battle-type-try", (battleType) => {
      this.battleTypeView.innerHTML = battleType
    })

    this.root = document.createElement('div')
    this.root.setAttribute("id", "battle-container")
    this.root.setAttribute("tabindex", 1)
    this.root.addEventListener('keypress', this.onKeyPress.bind(this))

    this.header = document.createElement("h2")
    this.header.setAttribute("class", "battle-view-character-name")
    this.header.innerHTML = `${this.character.name} Chooses:` 

    this.root.appendChild(this.header)

    this.choiceContainer = document.createElement("div")
    this.choiceContainer.classList.add("battle-view-choice-container")
    this.root.appendChild(this.choiceContainer)

    this.timerContainer = document.createElement("div")
    this.timerContainer.setAttribute("id", "battle-view-timer-container")
    this.timerContainer.classList.add("battle-view-timer-container")
    this.root.appendChild(this.timerContainer)
    this.countdownTimer = document.createElement("div")
    this.countdownTimer.classList.add("countdown-progress-bar")
    this.timerContainer.appendChild(this.countdownTimer)

    this.buttonContainer = document.createElement("div")
    this.buttonContainer.setAttribute("id", "battle-view-button-container")
    this.root.appendChild(this.buttonContainer)
    
    this.skipButton = document.createElement("div")
    this.skipButton.setAttribute("class", "battle-view-button")
    this.skipButton.addEventListener('click', this.onSkip.bind(this))
    this.skipButton.innerHTML = `Skip`
    this.buttonContainer.appendChild(this.skipButton)
    
    this.favoriteButton = document.createElement("div")
    this.favoriteButton.setAttribute("class", "battle-view-button")
    this.favoriteButton.addEventListener('click', this.onFavorite.bind(this))
    this.favoriteButton.innerHTML = `Favorite`
    this.buttonContainer.appendChild(this.favoriteButton)

    this.showTimerSwitch = document.createElement("div")
    this.showTimerSwitch.setAttribute("id", "battle-view-show-timer")
    this.showTimerSwitch.setAttribute("class", "battle-view-button")
    this.showTimerSwitch.innerHTML = "Hide Timer"
    this.showTimerSwitch.addEventListener("click", this.toggleTimerView.bind(this))
    this.buttonContainer.appendChild(this.showTimerSwitch)

    this.battleTypeView = document.createElement("div")
    this.battleTypeView.classList.add("battle-type-view")
    this.root.appendChild(this.battleTypeView)

    this.setupBattle()
  }

  getView() {
    return this.root
  }

  viewWillDisappear() {
    this.clearBattleTimer()
  }

  setupBattle() {
    this.clearBattleTimer()
    this.favoriteButton.innerHTML = `Favorite`

    this.choiceContainer.innerHTML = ""
    let battleData = this.battlePairer.getBattle()

    this.choiceDataOne = battleData[0]
    this.choiceOne = this.getChoiceButtonView(this.choiceDataOne)
    this.choiceContainer.appendChild(this.choiceOne)

    this.choiceDataTwo = battleData[1]
    this.choiceTwo = this.getChoiceButtonView(this.choiceDataTwo)
    this.choiceContainer.appendChild(this.choiceTwo)

    if(this.showTimer) {
      this.startBattleTimerView()
    }

    this.emit('battle-start', battleData)
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
  }

  getChoiceButtonView(choiceData) {
    let result = document.createElement("div")
    result.setAttribute("class", "battle-view-choice-button")
    result.setAttribute("data-id", choiceData.id)
    result.addEventListener('click', this.onChoiceClick.bind(this))
    result.innerHTML = choiceData.name
    return result
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
    if(this.favoriteButton.innerHTML === `✔ Favorite`) {
      this.favoriteButton.innerHTML = `Favorite`
    } else {
      this.favoriteButton.innerHTML = `✔ Favorite`
    }
    this.setupBattle()
  }

  clearBattleTimer() {
    if(this.timerID) {
      clearInterval(this.timerID)
      this.timerID = null
    }
  }

  startBattleTimerView() {
    this.battleStartTime = Date.now()
    this.timerID = setInterval(() => {
      let now = Date.now()
      let elapsed = now - this.battleStartTime
      if(elapsed > (EXPIRE_TIME)) {
        this.onSkip()
      }
      this.countdownTimer.setAttribute("style", `width: ${((EXPIRE_TIME-elapsed)/EXPIRE_TIME)*100}%`)
    }, 1000/60)
  }

  toggleTimerView(event) {
    this.showTimer = !this.showTimer
    if(this.showTimer) {
      this.showTimerSwitch.innerHTML = "Hide Timer"
      this.timerContainer.classList.remove("hidden")
      this.clearBattleTimer()
      this.startBattleTimerView()
    } else {
      this.showTimerSwitch.innerHTML = "Show Timer"
      this.timerContainer.classList.add("hidden")
      this.clearBattleTimer()
    }
  } 

}