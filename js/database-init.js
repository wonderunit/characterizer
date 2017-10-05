const fs = require('fs')
const path = require('path')

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
  seedDB
}
