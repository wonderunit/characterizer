module.exports.up = function(knex, Promise) {
  let characterQuery = knex.schema.hasTable('Characters').then((exists) => {
    if(!exists) {
      return knex.schema.createTable('Characters', function(table) {
        table.string('name')
        table.increments('id').primary()
        table.timestamps(false, true)
      })
    } else {
      return Promise.resolve(true)
    }
  })

  let valuesQuery = knex.schema.hasTable('Values').then((exists) => {
    if(!exists) {
      return knex.schema.createTable('Values', function(table) {
        table.string('name')
        table.increments('id').primary()
        table.string('uuid')
        table.timestamps(false, true)
      })
    } else {
      return Promise.resolve(true)
    }
  })

  let collectionsQuery = knex.schema.hasTable('Collections').then((exists) => {
    if(!exists) {
      return knex.schema.createTable('Collections', function(table) {
        table.string('name')
        table.increments('id').primary()
        table.timestamps(false, true)
      })
    } else {
      return Promise.resolve(true)
    }
  })

  let characterValuesQuery = knex.schema.hasTable('CharacterValues').then((exists) => {
    if(!exists) {
      return knex.schema.createTable('CharacterValues',function(table){
        table.increments('id').primary()
        table.integer('characterID').references('id').inTable('Characters')
        table.integer('valueID').references('id').inTable('Values')
        table.integer('wins')
        table.integer('losses')
        table.integer('battleCount')
        table.float('score')
        table.timestamps(false, true)
      })
    } else {
      return Promise.resolve(true)
    }
  })
  
  let valuesCollectionsQuery = knex.schema.hasTable('ValuesCollections').then((exists) => {
    if(!exists) {
      return knex.schema.createTable('ValuesCollections',function(table){
        table.increments('id').primary()
        table.string('name')
        table.integer('valueID').references('id').inTable('Values')
        table.timestamps(false, true)
      })
    } else {
      return Promise.resolve(true)
    }
  })
  
  let valuesBattleOutcomesQuery = knex.schema.hasTable('ValuesBattleOutcomes').then((exists) => {
    if(!exists) {
      return knex.schema.createTable('ValuesBattleOutcomes',function(table){
        table.increments('id').primary()
        table.integer('characterID').references('id').inTable('Characters')
        table.integer('loser').references('id').inTable('Values')
        table.integer('winner').references('id').inTable('Values')
        table.timestamps(false, true)
      })
    } else {
      return Promise.resolve(true)
    }
  })
  
  let valuesBattleFavorites = knex.schema.hasTable('ValuesBattleFavorites').then((exists) => {
    if(!exists) {
      return knex.schema.createTable('ValuesBattleFavorites',function(table){
        table.increments('id').primary()
        table.integer('characterID').references('id').inTable('Characters')
        table.integer('value1ID').references('id').inTable('Values')
        table.integer('value2ID').references('id').inTable('Values')
        table.timestamps(false, true)
      })
    } else {
      return Promise.resolve(true)
    }
  })

  return Promise.all([
    characterQuery,
    valuesQuery,
    collectionsQuery,
    characterValuesQuery,
    valuesCollectionsQuery,
    valuesBattleOutcomesQuery
  ])
}

module.exports.down = function(knex, Promise) {

}