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

  return Promise.all([
    ValueComparisonFavorites
  ])
}

module.exports.down = function(knex, Promise) {

}