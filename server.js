const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const multer = require("multer");
const { Client } = require("pg");

const app = express();

// Database connection
const db = new Client({
  user: "postgres",
  host: "localhost",
  database: "mybookdb",
  password: "1234",
  port: 5432,
});
db.connect();

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

// Configure Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage: storage });

// Set the view engine to EJS
app.set("view engine", "ejs");

// Routes
app.get("/", async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM books");
    const books = result.rows;
    res.render("index", { books });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error retrieving books");
  }
});

app.post("/books", upload.single("cover"), async (req, res) => {
  const { title, author, genre, review, rating } = req.body;
  const cover = req.file ? "/uploads/" + req.file.filename : null;
  try {
    await db.query(
      "INSERT INTO books (title, author, genre, review, rating, cover) VALUES ($1, $2, $3, $4, $5, $6)",
      [title, author, genre, review, rating, cover]
    );
    res.redirect("/");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error adding book");
  }
});

app.get("/books/edit/:id", async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM books WHERE id = $1", [
      req.params.id,
    ]);
    const book = result.rows[0];
    res.render("edit", { book });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error retrieving book for edit");
  }
});

app.post("/books/edit/:id", upload.single("cover"), async (req, res) => {
  const { title, author, genre, review, rating } = req.body;
  const cover = req.file ? "/uploads/" + req.file.filename : req.body.oldCover;
  try {
    await db.query(
      "UPDATE books SET title = $1, author = $2, genre = $3, review = $4, rating = $5, cover = $6 WHERE id = $7",
      [title, author, genre, review, rating, cover, req.params.id]
    );
    res.redirect("/");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error updating book");
  }
});

app.post("/books/delete/:id", async (req, res) => {
  try {
    await db.query("DELETE FROM books WHERE id = $1", [req.params.id]);
    res.redirect("/");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error deleting book");
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
