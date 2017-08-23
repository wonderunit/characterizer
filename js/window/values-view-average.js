const EventEmitter = require('events').EventEmitter
const {remote} = require('electron')

let knex
knex = remote.getGlobal('knex')

module.exports = class ValuesViewAverage extends EventEmitter {
  constructor(properties) {
    super()
    if(!properties.character) throw new Error("Missing Character")
    this.character = properties.character

    this.valuesMap = properties.valuesMap

    this.root = document.createElement('div')
    this.root.setAttribute("id", "values-view")
    this.values = []
    

    knex.select()
      .from('ValuesBattleOutcomes')
      .where({characterID: this.character.id})
      .then(battleOutcomes => {
        for(let battleOutcome of battleOutcomes) {
          this.updateValues(battleOutcome)
        }
        this.updateView()
      })
      .catch(console.error)
  }

  getView() {
    return this.root
  }

  updateView() {
    this.root.innerHTML = ''
    for(let value of this.values) {
      let valueView = document.createElement('div')
      valueView.setAttribute("class", "value-list-name")
      let progressView = document.createElement('div')
      progressView.setAttribute("class", "value-list-progress")
      progressView.setAttribute("style", `width: ${value.score*100}%`)
      valueView.appendChild(progressView)
      let nameView = document.createElement('div')
      nameView.setAttribute("class", "value-list-label")
      nameView.innerHTML = `${value.name} | ${value.score}`
      valueView.appendChild(nameView)
      this.root.appendChild(valueView)
    }
  }

  onBattleOutcome(battleOutcome) {
    this.updateValues(battleOutcome)
    this.updateView()
  }

  updateValues(battleOutcome) {
    let winner = this.getValueWithID(battleOutcome.winner)
    let needsSort = false
    if(!winner) {
      winner = {
        winner: 1,
        loser: 0,
        score: 1,
        id: battleOutcome.winner,
        name: this.valuesMap[battleOutcome.winner.toString()].name
      }
      this.insertIntoValuesSorted(winner)
    } else {
      winner.winner += 1
      winner.score = winner.winner / (winner.winner + winner.loser)
      needsSort = true
    }

    let loser = this.getValueWithID(battleOutcome.loser)
    if(!loser) {
      loser = {
        winner: 0,
        loser: 1,
        score: 0,
        id: battleOutcome.loser,
        name: this.valuesMap[battleOutcome.loser.toString()].name
      }
      this.insertIntoValuesSorted(loser)
    } else {
      loser.loser += 1
      loser.score = loser.winner / (loser.winner + loser.loser)
      needsSort = true
    }
    needsSort ? this.values.sort((a, b)=>{ return b.score - a.score }) : null
  }

  getValueWithID(valueID) {
    let result
    for(let value of this.values) {
      if(value.id === valueID) {
        result = value
        break
      }
    }
    return result
  }

  insertIntoValuesSorted(value) {
    // if it's the largest score, put it on the front
    if(this.values.length < 1 || this.values[0].score <= value.score) {
      this.values.unshift(value)
      return
    }
    
    // if it's the smallest score, put it on the back
    if(this.values[this.values.length-1].score >= value.score) {
      this.values.push(value)
      return
    }

    // put it in the middle
    for(let i = 0; i<this.values.length; i++) {
      if(this.values[i].score < value.score) {
        this.values.splice(i, 0, value)
        break
      }
    }
  }

  sortValues(value) {
    this.values.sort((a, b) => {
      return a.score > b.score
    })
  }
}