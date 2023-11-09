// Imports the index.js file to be tested.
const server = require('../index'); //TO-DO Make sure the path to your index.js is correctly added
// Importing libraries

// Chai HTTP provides an interface for live integration testing of the API's.
const chai = require('chai');
const chaiHttp = require('chai-http');
chai.should();
chai.use(chaiHttp);
const {assert, expect} = chai;

describe('Server!', () => {
  // Sample test case given to test / endpoint.
  it('Sample Test', done => {
    expect("test").to.equals("test");
    done();
  });
  // assert.strictEqual(res.body.message, 'Welcome!');

  // ===========================================================================
  // TO-DO: Part A Login unit test case
});