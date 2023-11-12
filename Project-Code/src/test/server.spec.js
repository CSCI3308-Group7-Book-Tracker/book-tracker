// Imports the index.js file to be tested.
const server = require('../index'); //TO-DO Make sure the path to your index.js is correctly added
// Importing libraries
const bcrypt = require('bcryptjs'); //  To hash passwords
const sinon = require('sinon'); // Sinon for mock db insert testing
const { databaseModule } = require('../databaseModule');
// Chai HTTP provides an interface for live integration testing of the API's.
const chai = require('chai');
const chaiHttp = require('chai-http');
chai.should();
chai.use(chaiHttp);
chai.use(require('sinon-chai'));
const {assert, expect} = chai;

// Cheerio for HTML parsing and querying
const cheerio = require('cheerio');

describe('Server!', () => {
  // Sample test case given to test / endpoint.
  it('Sample Test', done => {
    expect("test").to.equals("test");
    done();
  });


  // ===========================================================================
  // TO-DO: Part A Login unit test case

  // **********
  //   LOGIN
  // **********
  it('Positive : Successful Login', done => {
    chai
        .request(server)
        .post('/login')
        .send({ username: "admin" , password: "admin" })
        .end((err, res) => {
            expect(res).to.have.status(200);
            done();
        });
  });

  it('Negative : User Does Not Exist', done => {
    chai
        .request(server)
        .post('/login')
        .send({ username: "garbage123" , password: "garbage" })
        .end((err, res) => {
            expect(res).to.have.status(404);

            const $ = cheerio.load(res.text);
            const message = $('.alert-danger').text().trim();
            expect(message).to.equals('User does not exist. Register instead.');
            done();
        });
  });

  it('Negative : Incorrect Password', done => {
    chai
        .request(server)
        .post('/login')
        .send({ username: "admin" , password: "garbage" })
        .end((err, res) => {
            expect(res).to.have.status(401);

            const $ = cheerio.load(res.text);
            const message = $('.alert-danger').text().trim();
            expect(message).to.equals('Wrong Password, Try Again Please.');
            done();
        });
  });

  // **********
  // REGISTER
  // **********
  it('Positive : Successful Register', async () => {
    const stubBcryptHash = sinon.stub(bcrypt, 'hash').resolves('hashedPassword');
    const stubDatabaseInsert = sinon.stub(databaseModule, 'insertUser').resolves({
      user_id: 1000,
      username: 'test',
      password: 'hashedPassword',
      books_read: 0,
      reviews_left: 0,
    });
  
    const userData = {
      username: 'test',
      password: 'test',
    };

    try {
      const result = await databaseModule.insertUser(userData.username, 'hashedPassword');

      expect(stubDatabaseInsert).to.have.been.calledWith('test', 'hashedPassword');
      expect(result).to.deep.equal({
        user_id: 1000,
        username: 'test',
        password: 'hashedPassword',
        books_read: 0,
        reviews_left: 0,
      });
  
    } finally {
      stubBcryptHash.restore();
      stubDatabaseInsert.restore();
      sinon.restore();
    }
  });

  it('Negative : User Already Exists', done => {
    chai
        .request(server)
        .post('/register')
        .send({ username: "admin" , password: "garbage" })
        .end((err, res) => {
            expect(res).to.have.status(409);

            const $ = cheerio.load(res.text);
            const message = $('.alert-danger').text().trim();
            expect(message).to.equals('User already exists. Login instead.');
            done();
        });
  });

  it('Negative : Username Too Long', done => {
    chai
        .request(server)
        .post('/register')
        .send({ username: "ghfjdghkfjdgksjfdgfkdjgkjdsgdsjfgldsjhfaldsjhflfsdghdflgjhdslkfjhsldkgfjhfdlkjhdslkfjdhkgjhdfkjdhkgjshfkjlgkd", password: "garbage" })
        .end((err, res) => {
            expect(res).to.have.status(431);

            const $ = cheerio.load(res.text);
            const message = $('.alert-danger').text().trim();
            expect(message).to.equals('Username cannot exceed 100 characters');
            done();
        });
  });
});