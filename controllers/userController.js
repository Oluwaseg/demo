const path = require("path");
const bcrypt = require("bcrypt");
const validator = require("validator");
const userModel = require("../models/userModel");
const jwt = require("jsonwebtoken");

const secretKey = process.env.JWT_SECRET;

// Function to create a JWT token for a user
const createToken = (user) => {
  const tokenData = {
    userId: user._id,
    email: user.email,
    name: user.name,
    username: user.username,
  };

  const token = jwt.sign(tokenData, secretKey, { expiresIn: "1h" });
  return token;
};

exports.getIndex = (req, res) => {
  res.render("index.ejs");
};

exports.getHome = (req, res) => {
  if (req.isAuthenticated()) {
    const userData = req.user;
    res.render("home.ejs", { user: userData });
  } else {
    console.log("no user");
    res.redirect("/login");
  }
};

exports.getAbout = (req, res) => {
  res.render("about.ejs");
};

exports.getFeatures = (req, res) => {
  res.render("coin_tracker.ejs");
};

exports.getLogin = (req, res) => {
  res.render("login.ejs");
};

exports.getRegister = (req, res) => {
  console.log("Reached getRegister");
  res.render("register.ejs", { messages: req.flash("error") });
};

exports.getLogout = (req, res) => {
  res.render("logout");
};

exports.postLogout = (req, res) => {
  // Destroy the user's session to log them out
  req.session.destroy((err) => {
    if (err) {
      console.error("Error destroying session:", err);
    } else {
      console.log("User has been logged out.");
    }
    res.redirect("/login"); // Redirect to the login page or any other desired page
  });
};

exports.postRegister = async (req, res) => {
  try {
    const { name, email, password, username } = req.body;

    // Check if email or username already exist
    const existingUser = await userModel.findOne({
      $or: [{ email: email }, { username: username }],
    });

    if (existingUser) {
      if (existingUser.email === email) {
        req.flash("error", "User with the given email already exists");
      } else {
        req.flash("error", "User with the given username already exists");
      }
      return res.redirect("/register");
    }

    if (!name || !email || !password || !username) {
      req.flash("error", "All fields are required..!");
      return res.redirect("/register");
    }

    if (!validator.isEmail(email)) {
      req.flash("error", "Please input a valid email.");
      return res.redirect("/register");
    }

    if (!validator.isStrongPassword(password)) {
      req.flash("error", "Password must be strong.");
      return res.redirect("/register");
    }

    const profileImage = req.file; // Extract the uploaded image
    const imageFilePath = profileImage
      ? profileImage.path
      : "public\\uploads\\default.jpg";

    const imageUrl = `/uploads/${path.basename(imageFilePath)}`;
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new userModel({
      username,
      name,
      email,
      password: hashedPassword,
      profileImage: imageUrl,
    });

    await user.save();

    // Generate JWT token
    const token = createToken(user);

    // Optionally, set the token in a cookie or send it in the response header
    res.cookie("jwt", token, { httpOnly: true });

    // Redirect to login without flash messages
    return res.redirect("/login");
  } catch (error) {
    console.error("Registration failed:", error);
    // Redirect to register without flash messages
    res.redirect("/register");
  }
};

exports.postLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await userModel.findOne({ email: email });

    if (!user) {
      req.flash("Invalid email or password");
      return res.redirect("/login");
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      req.flash("Please check your email and password.");
      return res.redirect("/login");
    }

    // Authentication successful - create and set JWT token
    const token = createToken(user);

    // Optionally, set the token in a cookie or send it in the response header
    res.cookie("jwt", token, { httpOnly: true });

    // Redirect to the home page or wherever you want to go after login
    return res.redirect("/home");
  } catch (error) {
    console.error("An error occurred:", error);
    return next(error);
  }
};
