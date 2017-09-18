const EventEmitter = require('events').EventEmitter
const {remote} = require('electron')

let knex = remote.getGlobal('knex')

const EXPIRE_TIME = 10*1000

module.exports = class BattleView extends EventEmitter {
  constructor(properties) {
    super()

    if(!properties.character) throw new Error("Missing character")
    this.character = properties.character
    
    if(!properties.battlePairer) throw new Error("Missing battlePairer")
    this.battlePairer = properties.battlePairer

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
    this.root.appendChild(this.timerContainer)
    this.countdownTimer = document.createElement("div")
    this.countdownTimer.classList.add("countdown-progress-bar")
    this.timerContainer.appendChild(this.countdownTimer)
    
    this.skipButton = document.createElement("div")
    this.skipButton.setAttribute("class", "battle-view-skip")
    this.skipButton.addEventListener('click', this.onSkip.bind(this))
    this.skipButton.innerHTML = `Skip`
    this.root.appendChild(this.skipButton)

    this.setupBattle()
  }

  getView() {
    return this.root
  }

  setupBattle() {
    if(this.timerID) {
      clearInterval(this.timerID)
      this.timerID = null
    }
    this.battleStartTime = Date.now()

    this.choiceContainer.innerHTML = ""
    let battleData = this.battlePairer.getBattle()

    this.choiceDataOne = battleData[0]
    this.choiceOne = this.getChoiceButtonView(this.choiceDataOne)
    this.choiceContainer.appendChild(this.choiceOne)

    this.choiceDataTwo = battleData[1]
    this.choiceTwo = this.getChoiceButtonView(this.choiceDataTwo)
    this.choiceContainer.appendChild(this.choiceTwo)

    this.startBattleTimerView()

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

  startBattleTimerView() {
    this.timerID = setInterval(() => {
      let now = Date.now()
      let elapsed = now - this.battleStartTime
      if(elapsed > (EXPIRE_TIME)) {
        this.onSkip()
      }
      this.countdownTimer.setAttribute("style", `width: ${((EXPIRE_TIME-elapsed)/EXPIRE_TIME)*100}%`)
    }, 1000/60)
  }

}