// *****************************************************
// <!-- Section 1 : Import Dependencies -->
// *****************************************************

const express = require('express'); // To build an application server or API
const app = express();
const bodyParser = require('body-parser');
const session = require('express-session'); // To set the session object. To store or access session data, use the `req.session`, which is (generally) serialized as JSON by the store.
const bcrypt = require('bcrypt'); //  To hash passwords
const axios = require('axios'); // To make HTTP requests from our server. We'll learn more about it in Part B.

const { db } = require('./databaseModule');

// *****************************************************
// <!-- Section 2 : Connect to DB -->
// *****************************************************

// test your database
db.connect()
  .then(obj => {
    console.log('Database connection successful'); // you can view this message in the docker compose logs
    obj.done(); // success, release the connection;
  })
  .catch(error => {
    console.log('ERROR:', error.message || error);
  });

// *****************************************************
// <!-- Section 3 : App Settings -->
// *****************************************************

app.set('view engine', 'ejs'); // set the view engine to EJS
app.use(bodyParser.json()); // specify the usage of JSON for parsing request body.

// initialize session variables
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    saveUninitialized: false,
    resave: false,
  })
);

app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

// *****************************************************
// <!-- Section 4 : API Routes -->
// *****************************************************
const user = {
  username: undefined,
  password: undefined,
  books_read: undefined,
  reviews_left: undefined
};

// TODO - Include your API routes here
app.get('/', (req, res) => {
    res.redirect('/login');
})

app.get('/login', (req, res) => {
    res.render("pages/login");
})

app.get('/register', (req,res) => {
  res.render('pages/register')
})

app.post('/register', async (req,res) => {
    const username = req.body.username;
    const hash = await bcrypt.hash(req.body.password, 10);
    const query = "INSERT INTO users(username, password, books_read, reviews_left) VALUES ($1, $2, $3, $4) RETURNING *;";

    await db.one(query, [username, hash, 0, 0])
      .then(() => {
          res.redirect('/login')
      })
      .catch((err) => {
        // user already exists, redirect to login
        if (err.code == 23505) {
          res.status(409).render('pages/login', {
            error: true,
            message: 'User already exists. Login instead.'
          });
        } else {
          // only other error comes from too long username
          res.status(431).render('pages/register', {
            error: true,
            message: 'Username cannot exceed 100 characters'
          });
        } 
      });
})

app.post('/login', async (req,res) => {
    const username = req.body.username;
    const query = "select * from users where users.username = $1";

    db.one(query, [username])
    .then((data) => {
      // check if password from request matches with password in DB
      bcrypt.compare(req.body.password, data.password)
        .then((match) => {
          if (match) {
            user.username = data.username;
            user.password = data.password;
    
            req.session.user = user;
            req.session.save();
            res.redirect('/login');
          } else {
            res
              .status(401)
              .render('pages/login', {
              error: true,
              message: 'Wrong Password, Try Again Please.'}
            );
          }
        })
        .catch((bcryptError) => {
          // console.log(bcryptError);
          res.redirect('/login');
        });
    })
    .catch((err) => {
      // console.log(err);
      if (err.message === 'No data returned from the query.') {
        res
          .status(404)
          .render('pages/register', {
            error: true,
            message: 'User does not exist. Register instead.'
          }
        );
      } else {
        res.redirect("/login");
      }
    });
})

// Authentication Middleware.
const auth = (req, res, next) => {
  if (!req.session.user) {
    // Default to login page.
    return res.redirect('/login');
  }
  next();
};

// Authentication Required
app.use(auth);

// we will add more main page components (pages that require a logged in user) after this auth middleware component.

app.get("/logout", (req, res) => {
  req.session.destroy();
  res.render("pages/login", {
    message: "Logged Out Successfully."
  });
});


// *****************************************************
// <!-- Section 5 : Start Server-->
// *****************************************************
// starting the server and keeping the connection open to listen for more requests
module.exports = app.listen(3000);
console.log('Server is listening on port 3000');