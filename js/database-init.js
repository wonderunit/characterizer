const fs = require('fs')

function initDB(knex) {
  let characterQuery = knex.schema.createTableIfNotExists('Characters', function(table) {
    table.string('name')
    table.increments('id').primary()
  })

  let valuesQuery = knex.schema.createTableIfNotExists('Values', function(table) {
    table.string('name')
    table.increments('id').primary()
    table.string('uuid')
  })

  let collectionsQuery = knex.schema.createTableIfNotExists('Collections', function(table) {
    table.string('name')
    table.increments('id').primary()
  })

  let characterValuesQuery = knex.schema.createTableIfNotExists('CharacterValues',function(table){
    table.increments('id').primary()
    table.integer('characterID').references('id').inTable('Characters')
    table.integer('valueID').references('id').inTable('Values')
    table.integer('wins')
    table.integer('losses')
    table.float('score')
  })
  
  let valuesCollectionsQuery = knex.schema.createTableIfNotExists('ValuesCollections',function(table){
    table.increments('id').primary()
    table.string('name')
    table.integer('valueID').references('id').inTable('Values')
  })
  
  let valuesBattleOutcomesQuery = knex.schema.createTableIfNotExists('ValuesBattleOutcomes',function(table){
    table.increments('id').primary()
    table.integer('characterID').references('id').inTable('Characters')
    table.integer('loser').references('id').inTable('Values')
    table.integer('winner').references('id').inTable('Values')
  })

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
      seedDB(knex)
    })
    .catch(console.error)
}

function seedDB(knex) {
  var lineReader = require('readline').createInterface({
    input: require('fs').createReadStream('./data/values.txt')
  });
  
  lineReader.on('line', (line)=>{
    knex('Values').where({name: line}).select('id')
      .then(result => {
        if(!result || result.length === 0) {
          knex('Values').insert({name: line, uuid: generateUUID()})
            .then(value => {
              // console.log(`Added Value: ${JSON.stringify(value)}`)
            })
        }
      })
    })
}

function generateUUID() {
  return Math.floor(Math.random() * Math.pow(2, 32)).toString(32)
}

module.exports = {
  initDB,
  seedDB
}
