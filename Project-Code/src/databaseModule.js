// databaseModule.js

const pgp = require('pg-promise')();
const bcrypt = require('bcryptjs'); //  To hash passwords

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

  initializeDatabase: async () => {
    const isAdminUserExists = async () => {
      const query = `SELECT COUNT(*) as count FROM users WHERE username = 'admin'`;
    
      const result = await db.one(query);
      return result.count > 0;
    };

    try {
      const obj = await db.connect();
      console.log('Database connection successful');
  
      const adminUserExists = await isAdminUserExists();
  
      if (!adminUserExists) {
        const hash = await bcrypt.hash('admin', 10);
        const query = "INSERT INTO users(username, password, books_read, reviews_left) VALUES ($1, $2, $3, $4) RETURNING *;";
  
        await obj.query(query, ['admin', hash, 0, 0]);
        console.log('Admin user added to database');
      } else {
        console.log('Admin user already exists. Skipping initialization');
      }
  
      obj.done();
    } catch (error) {
      console.log('ERROR:', error.message || error);
    }
  },
};

module.exports = { databaseModule, db };
