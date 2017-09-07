const fs = require('fs')
const path = require('path')

function initDB(knex, properties) {
  let characterQuery = knex.schema.createTableIfNotExists('Characters', function(table) {
    table.string('name')
    table.increments('id').primary()
    table.timestamps(false, true)
  })

  let valuesQuery = knex.schema.createTableIfNotExists('Values', function(table) {
    table.string('name')
    table.increments('id').primary()
    table.string('uuid')
    table.timestamps(false, true)
  })

  let collectionsQuery = knex.schema.createTableIfNotExists('Collections', function(table) {
    table.string('name')
    table.increments('id').primary()
    table.timestamps(false, true)
  })

  let characterValuesQuery = knex.schema.createTableIfNotExists('CharacterValues',function(table){
    table.increments('id').primary()
    table.integer('characterID').references('id').inTable('Characters')
    table.integer('valueID').references('id').inTable('Values')
    table.integer('wins')
    table.integer('losses')
    table.integer('battleCount')
    table.float('score')
    table.timestamps(false, true)
  })
  
  let valuesCollectionsQuery = knex.schema.createTableIfNotExists('ValuesCollections',function(table){
    table.increments('id').primary()
    table.string('name')
    table.integer('valueID').references('id').inTable('Values')
    table.timestamps(false, true)
  })
  
  let valuesBattleOutcomesQuery = knex.schema.createTableIfNotExists('ValuesBattleOutcomes',function(table){
    table.increments('id').primary()
    table.integer('characterID').references('id').inTable('Characters')
    table.integer('loser').references('id').inTable('Values')
    table.integer('winner').references('id').inTable('Values')
    table.timestamps(false, true)
  })

  return new Promise((fulfill, reject) =>{
    Promise.all([
      characterQuery,
      valuesQuery,
      collectionsQuery,
      characterValuesQuery,
      valuesCollectionsQuery,
      valuesBattleOutcomesQuery,
    ])
      .then(results => {
        console.log("db initialized")
        seedDB(knex, properties)
          .then(()=>{
            fulfill()
          })
      })
      .catch(reject)
  })
}

function seedDB(knex, properties) {
  let values = fs.readFileSync(properties.valuesSeedDataPath).toString().split("\n");
  let writes = values.map(value => {
    return new Promise((fulfill, reject)=>{
      knex('Values').where({name: value}).select('id')
        .then(result => {
          // check for existing value
          if(!result || result.length === 0) {
            knex('Values').insert({name: value, uuid: generateUUID()})
              .then(value => {
                // console.log(`Added Value: ${JSON.stringify(value)}`)
                fulfill()
              })
          } else {
            fulfill()
          }
        })
        .catch(reject)
    })
  })
  return Promise.all(writes)
}

function generateUUID() {
  return Math.floor(Math.random() * Math.pow(2, 32)).toString(32)
}

module.exports = {
  initDB,
  seedDB
}
