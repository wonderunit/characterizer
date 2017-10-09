module.exports.up = function(knex, Promise) {
  let ValueComparisonFavorites = knex.schema.hasTable('ValueComparisonFavorites').then((exists) => {
    if(!exists) {
      return knex.schema.createTable('ValueComparisonFavorites', function(table) {
        table.integer('character1ID').references('id').inTable('Characters')
        table.integer('value1ID').references('id').inTable('Values')

        table.integer('character2ID').references('id').inTable('Characters')
        table.integer('value2ID').references('id').inTable('Values')

        table.timestamps(false, true)
        table.increments('id').primary()
      })
    } else {
      return Promise.resolve(true)
    }
  })

  let CharacterValueFavorites = knex.schema.hasTable('CharacterValueFavorites').then((exists) => {
    if(!exists) {
      return knex.schema.createTable('CharacterValueFavorites', function(table) { 
        table.integer('characterID').references('id').inTable('Characters')
        table.integer('valueID').references('id').inTable('Values')
        table.timestamps(false, true)
        table.increments('id').primary()
      })
    } else {
      return Promise.resolve(true)
    }
  })

  return Promise.all([
    ValueComparisonFavorites, 
    CharacterValueFavorites
  ])
}

module.exports.down = function(knex, Promise) {

}