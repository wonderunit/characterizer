const MainBaseView = require('./main-base-view.js')
const CharacterView = require('./character-view.js')
const BattleView = require('./battle-view.js')
const ValuesViewAverage = require('./values-view-average.js')
const ValuesViewDots = require('./values-view-dots.js')
const ValuesViewNone = require('./values-view-none.js')
const ValuesViewTime = require('./values-view-time.js')
const ValuesViewBattleCounts = require('./values-view-battle-counts.js')
const BattleTimeKeeper = require('../battle-timekeeper.js')

module.exports = class CharacterTrainerView extends MainBaseView {
  constructor(properties) {
    super(properties)
    this.valuesViewType = "average"
    
    this.root = document.createElement("div")
    this.root.setAttribute("id", "character-trainer-container")
    
    this.characterView = new CharacterView({"characters": this.getCharacters()})
    this.root.appendChild(this.characterView.getView())
    
    this.characterView.on('select-character', data => {
      this.onSelectCharacter(data.characterID)
    })
    this.characterView.on('add-character', data => {
      this.emit('add-character', data)
    })
    
    this.getCharacters()
      .then(inCharacters => {
        this.characters = inCharacters
        this.characterView.updateView()
      })
      .catch(console.error)

    this.battleView = document.createElement("div")
    this.battleView.setAttribute("id", "battle-container")
    this.root.appendChild(this.battleView)

    this.valuesViewSelector = document.createElement("select")
    this.valuesViewSelector.setAttribute("id", "values-view-selector")
    let valuesViewTypes = [
      {
        "value": "average",
        "label": "Average"
      },
      {
        "value": "dots",
        "label": "Dots"
      },
      {
        "value": "battleCounts",
        "label": "Battle Counts"
      },
      {
        "value": "time",
        "label": "Time"
      },
      {
        "value": "none",
        "label": "None"
      },
    ]
    for(let valuesViewType of valuesViewTypes) {
      let option = document.createElement("option")
      option.setAttribute("value", valuesViewType.value)
      option.innerHTML = valuesViewType.label
      this.valuesViewSelector.appendChild(option)
    }
    this.valuesViewSelector.addEventListener('change', (event)=>{
      this.valuesViewType = event.target.value
      this.onSelectCharacter(this.currentCharacterID)
    })
    this.root.appendChild(this.valuesViewSelector)

    this.valuesViewContainer = document.createElement("div")
    this.valuesViewContainer.setAttribute("id", "values-container")
    let valuesHeader = document.createElement("h2")
    valuesHeader.setAttribute("id", "values-header")
    valuesHeader.innerHTML = `Values`
    this.valuesViewContainer.appendChild(valuesHeader)
    this.valuesView = document.createElement("div")
    this.valuesView.setAttribute("id", "values-view")
    this.valuesViewContainer.appendChild(this.valuesView)
    this.root.appendChild(this.valuesViewContainer)
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
        
        document.getElementById("values-header").innerHTML = `${character.name}'s Values`
        document.getElementById("values-view").innerHTML = ''
        
        let ValuesView = this.getValuesView()
        let properties = { 
          valuesMap: this.valuesMap, 
          values: characterValues, 
          battlePairer: battlePairer, 
          battleTimeKeeper: this.curBattleTimeKeeper 
        }
        this.curValuesView = new ValuesView(properties)
        let existingValuesView = document.getElementById("values-view")
        this.valuesViewContainer.replaceChild(this.curValuesView.getView(), existingValuesView)
        
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
    this.curValuesView.onBattleOutcome(battleOutcome)
    this.curBattleTimeKeeper.onBattleOutcome(battleOutcome)
  }

  getValuesView() {
    switch(this.valuesViewType) {
      case "none":
        return ValuesViewNone
      case "dots":
        return ValuesViewDots
      case "battleCounts":
        return ValuesViewBattleCounts
      case "time":
        return ValuesViewTime
      case "average":
      default:
        return ValuesViewAverage
    }
  }

  getView() {
    return this.root
  }

  updateView() {
    this.curValuesView.updateView()
  }
}