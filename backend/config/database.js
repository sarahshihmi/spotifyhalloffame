const config = require('./index');

module.exports = {
  development: {
    storage: config.dbFile, // SQLite database file path
    dialect: 'sqlite', //  SQLite as the dialect
    seederStorage: 'sequelize', // Store seed data in Sequelize format
    logQueryParameters: true, // Log query parameters for debugging
    typeValidation: true // Enable type validation
  },
  production: {
    storage: config.dbFile, //changed this from post to sql
    dialect: 'sqlite',
    seederStorage: 'sequelize',
    logQueryParameters: false,
    typeValidation: true
  }
};