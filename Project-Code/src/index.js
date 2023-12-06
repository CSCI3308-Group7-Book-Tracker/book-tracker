// *****************************************************
// <!-- Section 1 : Import Dependencies -->
// *****************************************************

const express = require('express'); // To build an application server or API
const app = express();
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session'); // To set the session object. To store or access session data, use the `req.session`, which is (generally) serialized as JSON by the store.
const bcrypt = require('bcryptjs'); //  To hash passwords
const axios = require('axios'); // To make HTTP requests from our server. We'll learn more about it in Part B.

const { db } = require('./databaseModule');
const { databaseModule } = require('./databaseModule');

// *****************************************************
// <!-- Section 2 : Connect to DB -->
// *****************************************************

databaseModule.initializeDatabase();

// *****************************************************
// <!-- Section 3 : App Settings -->
// *****************************************************

app.set('view engine', 'ejs'); // set the view engine to EJS
app.use(bodyParser.json()); // specify the usage of JSON for parsing request body.
// Define the path to your static files (css, img, etc.)
const staticPath = path.join(__dirname, 'resources');
// Serve static files using express.static middleware
app.use(express.static(staticPath));

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
  id : undefined,
  username: undefined,
  password: undefined,
  books_read: undefined,
  reviews_left: undefined
};

var books = [];

// TODO - Include your API routes here
app.get('/', (req, res) => {
  res.redirect('/welcome');
})

app.get('/welcome', (req, res) => {
  res.render("pages/welcome");
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
            user.id = data.user_id;
            user.username = data.username;
            user.password = data.password;  
            user.books_read = data.books_read;
            user.reviews_left = data.reviews_left;
            req.session.user = user;
          
            req.session.save();
            res.render("pages/explore", {user: req.session.user, books:[]});
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

app.get('/profile', (req,res) => {
  db.any("SELECT * FROM users WHERE user_id = $1", [req.session.user.id])
    .then(data => {
      let user_input = data[0];
      res.render('pages/profile', {user_input});
  });

});

app.get("/logout", (req, res) => {
  req.session.destroy();
  res.render("pages/login", {
    message: "Logged Out Successfully."
  });
});


//render explore page initially
app.get("/explore", (req, res) => {
  res.render("pages/explore", {user: req.session.user, books:[]});
});

// explore page external api call
app.post('/explore', auth, async (req, res) => {
  try {
    const results = await axios({
      url: `https://www.googleapis.com/books/v1/volumes`,
      method: 'GET',
      dataType: 'json',
      headers: {
        'Accept-Encoding': 'application/json',
      },
      params: {
        key: process.env.API_KEY,
        q: req.body.title,
        maxsize: 10,
      },
    });

    const books = results.data.items;

    // Use Promise.all to wait for all reviews to be fetched
    const booksWithReviews = await Promise.all(
      books.map(async (book) => {
        const isbn = book?.volumeInfo?.industryIdentifiers?.[0]?.identifier;
        const reviews = await getReviews(isbn);
        return { ...book, reviews };
      })
    );

    res.render('pages/explore', { user: req.session.user, books: booksWithReviews });
  } catch (error) {
    console.error("Error fetching books: ", error);
    res.render('pages/explore', { user: req.session.user, books: [] });
  }
});

app.post("/addBook", auth, async (req, res)=>{
  let query = `INSERT INTO books (name, author, isbn, description, num_pages, year_published, img_url)
                VALUES ($1, $2, $3, $4, $5, $6, $7) 
                ON CONFLICT (isbn) DO NOTHING
                RETURNING *;`;
  db.any(query, [
    req.body.title,
    req.body.Author,
    req.body.ISBN,
    req.body.description,
    req.body.page_count,
    req.body.date,
    req.body.img_url
  ])
  .then(data => {
    // if the book inserted
    if (data.length > 0) {
      // check if user/isbn pair in users_to_books relation
      // insert connection only if not already present
      db.any("SELECT * FROM users_to_books WHERE user_id = $1 AND isbn = $2;", [req.session.user.id, data[0].isbn])
        .then(data => {
          if (data.length === 0) {
            db.any("INSERT INTO users_to_books (user_id, isbn) values ($1, $2);", [req.session.user.id, req.body.ISBN]).then(data2 => {
              db.any("UPDATE users SET books_read = books_read + 1 WHERE users.user_id = $1 RETURNING * ;", [req.session.user.id]);
            });
          } else {
            console.log("User already has this book in collection. Ignoring Duplicate.");
          }
        })
    } else {
      // book already exists
      console.log("Book with ISBN already exists. Ignoring duplicate.");
      // utilizes isbn from book that has already been added to books relation
      // check if user/isbn pair in users_to_books relation
      // insert connection only if not already present
      db.any("SELECT * FROM users_to_books WHERE user_id = $1 AND isbn = $2;", [req.session.user.id, req.body.ISBN])
        .then(data => {
          if (data.length === 0) {
            db.any("INSERT INTO users_to_books (user_id, isbn) values ($1, $2);", [req.session.user.id, req.body.ISBN]).then(data2 => {
              db.any("UPDATE users SET books_read = books_read + 1 WHERE users.user_id = $1 RETURNING * ;", [req.session.user.id]);
            });
          } else {
            console.log("User already has this book in collection. Ignoring Duplicate.");
          }
        })
    }
  })
  .catch(error => {
    // Handle other errors
    console.error("Error adding book:", error);
    res.status(500).send("Internal Server Error");
  });
});

async function getReviews(isbn) {
  try {
    const reviews = await db.any(
      `SELECT u.username, r.review, r.review_date
        FROM reviews r 
        INNER JOIN users u ON r.user_id = u.user_id 
        WHERE isbn = $1;`,
      [isbn]);
      return reviews.map(review => ({
        username: review.username,
        reviewText: review.review,
        reviewDate: review.review_date
      }));
  } catch (err) {
    console.error("Error fetching reviews: ", err);
    return [];
  }
};

app.post("/addReview", auth, async (req, res) => {
  console.log(req.body);

  // Use the found values in your query
  let query = "INSERT INTO reviews (user_id, isbn, review) VALUES ($1, $2, $3) RETURNING * ;";
  db.any(query, [req.session.user.id, req.body.bookId, req.body.reviewText])
    .then(data => {
      // Handle success
      db.any("UPDATE users SET reviews_left = reviews_left + 1 WHERE users.user_id = $1 RETURNING * ;", [req.session.user.id]);
      console.log("Review added:", data);
      res
        .status(200)
        .render('pages/collections', {
          user: req.session.user,
          books: req.session.books,
          message: 'Review Left Successfully, View Reviews on Books in the Explore Page!'
        }
      );
    })
    .catch(error => {
      // Handle error
      console.error("Error adding review:", error);
      res.status(500).send("Internal Server Error");
    });
});


app.get("/collections", (req, res) => {
  let query2 = "Select books.name, books.isbn, books.author, books.img_url from books Join users_to_books On books.isbn = users_to_books.isbn Join users On users_to_books.user_id = users.user_id where users.user_id = $1;";
  db.any(query2, [req.session.user.id])
    .then(data => {
      books = data;
      req.session.books = books;
      req.session.save();
      res.render('pages/collections', {user: req.session.user, books: req.session.books});
    })
 });

// *****************************************************
// <!-- Section 5 : Start Server-->
// *****************************************************
// starting the server and keeping the connection open to listen for more requests
module.exports = app.listen(3000);
console.log('Server is listening on port 3000');