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
  book_id SERIAL PRIMARY KEY NOT NULL,
  name VARCHAR(100),
  genre VARCHAR(100),
  author VARCHAR(100),
  isbn VARCHAR(100),
  description VARCHAR(10000),
  num_pages INT,
  year_published VARCHAR(50),
  img_url VARCHAR(500),
  avg_rating DECIMAL 
);

DROP TABLE IF EXISTS reviews CASCADE;
CREATE TABLE IF NOT EXISTS reviews (
  review_id SERIAL PRIMARY KEY NOT NULL,
  username VARCHAR(100),
  review VARCHAR(200),
  rating DECIMAL NOT NULL
);

DROP TABLE IF EXISTS images CASCADE;
CREATE TABLE IF NOT EXISTS images (
  image_id SERIAL PRIMARY KEY NOT NULL,
  image_url VARCHAR(500) NOT NULL
);

DROP TABLE IF EXISTS books_to_reviews CASCADE;
CREATE TABLE books_to_reviews (
  book_id INT NOT NULL,
  review_id INT NOT NULL,
  FOREIGN KEY (book_id) REFERENCES books (book_id),
  FOREIGN KEY (review_id) REFERENCES reviews (review_id)
);

DROP TABLE IF EXISTS users_to_reviews CASCADE;
CREATE TABLE users_to_reviews (
  user_id INT NOT NULL,
  review_id INT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users (user_id),
  FOREIGN KEY (review_id) REFERENCES reviews (review_id)
);

DROP TABLE IF EXISTS users_to_books CASCADE;
CREATE TABLE users_to_books (
  user_id INT NOT NULL,
  book_id INT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users (user_id),
  FOREIGN KEY (book_id) REFERENCES books (book_id),
  finished BOOLEAN NOT NULL
);

DROP TABLE IF EXISTS images_to_books CASCADE;
CREATE TABLE images_to_books (
  book_id INT NOT NULL,
  image_id INT NOT NULL,
  FOREIGN KEY (image_id) REFERENCES images (image_id),
  FOREIGN KEY (book_id) REFERENCES books (book_id)
);