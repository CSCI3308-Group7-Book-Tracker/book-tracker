// test-setup.js

const { databaseModule } = require('../databaseModule');

const setupTestDatabase = async () => {
  // Initialize the test database here
  await databaseModule.initializeDatabase();
};

// Call the function to set up the test database
setupTestDatabase();
