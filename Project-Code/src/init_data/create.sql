DROP TABLE IF EXISTS users CASCADE;
CREATE TABLE IF NOT EXISTS users (
  user_id SERIAL PRIMARY KEY NOT NULL,
  username VARCHAR(100) UNIQUE NOT NULL,
  password CHAR(60) NOT NULL,
  books_read INT NOT NULL,
  reviews_left INT NOT NULL
);

DROP TABLE IF EXISTS books CASCADE;
CREATE TABLE IF NOT EXISTS books (
  name VARCHAR(100),
  genre VARCHAR(100),
  author VARCHAR(100),
  isbn VARCHAR(100) PRIMARY KEY,
  description VARCHAR(10000),
  num_pages VARCHAR(20),
  year_published VARCHAR(50),
  img_url VARCHAR(500)
);

DROP TABLE IF EXISTS reviews CASCADE;
CREATE TABLE IF NOT EXISTS reviews (
  review_id SERIAL PRIMARY KEY NOT NULL,
  user_id INT NOT NULL,
  isbn VARCHAR(100) NOT NULL,
  review VARCHAR(200),
  review_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users (user_id),
  FOREIGN KEY (isbn) REFERENCES books (isbn)
);

DROP TABLE IF EXISTS users_to_books CASCADE;
CREATE TABLE users_to_books (
  user_id INT NOT NULL,
  isbn VARCHAR(100) NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users (user_id),
  FOREIGN KEY (isbn) REFERENCES books (isbn)
);

DROP TABLE IF EXISTS users_to_friends CASCADE;
CREATE TABLE users_to_friends (
  user_id INT NOT NULL,
  friend_id INT NOT NULL,
  FOREIGN KEY (friend_id) REFERENCES users (user_id),
  FOREIGN KEY (user_id) REFERENCES users (user_id)
);