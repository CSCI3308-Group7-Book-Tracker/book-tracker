// databaseModule.js

const pgp = require('pg-promise')();

// database configuration
const dbConfig = {
    host: 'db', // the database server
    port: 5432, // the database port
    database: process.env.POSTGRES_DB, // the database name
    user: process.env.POSTGRES_USER, // the user account to connect with
    password: process.env.POSTGRES_PASSWORD, // the password of the user account
  };
  
  const db = pgp(dbConfig);

const databaseModule = {
  insertUser: async (username, hashedPassword) => {
    try {
      const result = await db.one(
        'INSERT INTO users(username, password, books_read, reviews_left) VALUES ($1, $2, $3, $4) RETURNING *',
        [username, hashedPassword, 0, 0]
      );
      return result;
    } catch (error) {
      throw error;
    }
  },
};

module.exports = { databaseModule, db };
