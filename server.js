const express = require("express");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
const connectDB = require("./DB/db");
const userRoutes = require("./routes/userRoutes");
const authRoutes = require("./routes/authRoutes");
const cors = require("cors");
const flash = require("express-flash");
const session = require("express-session");
const multer = require("multer");
const path = require("path");
const cookieParser = require("cookie-parser");
dotenv.config();

const app = express();

// Configure session middleware
app.use(
  session({
    secret: process.env.SECRET_KEY, // Use process.env to access environment variables
    resave: false,
    saveUninitialized: true,
  })
);

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

// Set up middleware
app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.urlencoded({ extended: true }));
app.use(flash());
app.use(express.static("public"));
app.use("/uploads", express.static("public/uploads"));
app.use("/uploads", express.static(path.join(__dirname, "public", "uploads")));

// Use the routes
app.use("/user", userRoutes);
app.use("/auth", authRoutes);
app.get("/", (req, res) => {
  res.render("index.ejs");
});
// --------------app.listen -------------

const PORT = 3000;
connectDB().then(() => {
  app.listen(PORT, console.log(`Server is up on port ${PORT}`));
});
