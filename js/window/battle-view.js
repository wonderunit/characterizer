const EventEmitter = require('events').EventEmitter
const {remote} = require('electron')

let knex = remote.getGlobal('knex')

module.exports = class BattleView extends EventEmitter {
  constructor(properties) {
    super()

    if(!properties.choices) throw new Error("Missing Choices")
    this.choices = properties.choices

    if(!properties.character) throw new Error("Missing Character")
    this.character = properties.character

    this.root = document.createElement('div')
    this.root.setAttribute("id", "battle-container")
    this.root.setAttribute("tabindex", 1)
    this.root.addEventListener('keypress', this.onKeyPress.bind(this))

    this.header = document.createElement("h2")
    this.header.setAttribute("class", "battle-view-character-name")
    this.header.innerHTML = `${this.character.name} Chooses:` 

    this.root.appendChild(this.header)

    this.choiceContainer = document.createElement("div")
    this.choiceContainer.setAttribute("class", "battle-view-choice-container")
    this.root.appendChild(this.choiceContainer)

    this.setupBattle()
  }

  getView() {
    return this.root
  }

  setupBattle() {
    this.choiceContainer.innerHTML = ""
    this.choiceDataOne = this.getRandomChoiceData()
    this.choiceOne = this.getChoiceButtonView(this.choiceDataOne)
    this.choiceContainer.appendChild(this.choiceOne)

    this.choiceDataTwo = this.getRandomChoiceData([this.choiceDataOne])
    this.choiceTwo = this.getChoiceButtonView(this.choiceDataTwo)
    this.choiceContainer.appendChild(this.choiceTwo)
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

  getRandomChoiceData(exclusions) {
    let index = Math.floor(Math.random() * this.choices.length)
    // let data = this.choices.splice(index, 1)[0]
    let data = this.choices[index]
    if(exclusions && exclusions.includes(data)) {
      return this.getRandomChoiceData(exclusions)
    }
    return data
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

}