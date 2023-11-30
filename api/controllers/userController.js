const User = require("../models/userSchema");
const passport = require("passport");
const bcrypt = require("bcrypt");
const path = require("path");

// Controller functions
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

// Inside userController.js
exports.getRegister = (req, res) => {
  console.log("Reached getRegister");
  res.render("register.ejs");
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

    const isUser = await User.findOne({ email: email });

    if (isUser) {
      req.flash("error", "User already exists!");
      return res.redirect("/register");
    }

    const profileImage = req.file; // Extract the uploaded image
    const imageFilePath = profileImage
      ? profileImage.path
      : "public\\uploads\\default.jpg";

    const imageUrl = `/uploads/${path.basename(imageFilePath)}`;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      username,
      name,
      email,
      password: hashedPassword,
      profileImage: imageUrl,
    });

    await user
      .save()
      .then((data) => {
        res.redirect("/login");
      })
      .catch((err) => {
        console.log("Error while saving user data: ", err);
      });
  } catch (error) {
    console.error("Registration failed:", error);
    res.redirect("/register");
  }
};

exports.postLogin = (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      req.flash(
        "error",
        "Authentication failed. Please check your email and password."
      );
      console.log("Login failed:", info);
      return res.redirect("/login");
    }
    req.logIn(user, (err) => {
      if (err) {
        return next(err);
      }
      res.cookie("authCookie", "cookieValue", { sameSite: "Lax" });
      return res.redirect("/home");
    });
  })(req, res, next);
};
