const path = require("path");
const fs = require("fs");
const bcrypt = require("bcrypt");
const validator = require("validator");
const userModel = require("../models/userModel");
const jwt = require("jsonwebtoken");
const multer = require("multer");

require("dotenv").config();
const secretKey = process.env.JWT_SECRET;

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/uploads/profileImages");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage: storage });

// Function to create a JWT token for a user
const createToken = (user) => {
  const tokenData = {
    userId: user._id,
    email: user.email,
    name: user.name,
    username: user.username,
    profileImage: user.profileImage,
  };

  const token = jwt.sign(tokenData, secretKey, { expiresIn: "1d" });

  console.log("Token:", token);

  return token;
};

const verifyToken = (req, res, next) => {
  const token = req.cookies.jwt;

  if (!token) {
    return next(); // Proceed to the next middleware if no token is present
  }

  jwt.verify(token, secretKey, (err, decodedToken) => {
    if (err) {
      console.error("JWT verification failed:", err);
      return next();
    }

    req.user = decodedToken;
    next();
  });
};

const authMiddleware = (req, res, next) => {
  console.log("Auth Middleware triggered");
  res.header("Cache-Control", "private, no-cache, no-store, must-revalidate");
  res.header("Expires", "-1");
  res.header("Pragma", "no-cache");

  const token = req.cookies.jwt;

  if (!token) {
    return res.redirect("/auth/login");
  }

  try {
    const decoded = jwt.verify(token, secretKey);

    req.user = { ...decoded, tokens: [] };

    next();
  } catch (error) {
    console.error("Auth Middleware - JWT verification failed:", error);
    return res.redirect("/auth/login");
  }
};
const registerUser = async (req, res) => {
  try {
    const { name, email, password, username } = req.body;

    const existingUser = await userModel.findOne({
      $or: [{ email: email }, { username: username }],
    });

    if (existingUser) {
      req.flash(
        "error",
        "User with the given email or username already exists"
      );
      // return res
      //   .status(400)
      //   .json({ success: false, message: "User already exists" });
    }

    if (!name || !email || !password || !username) {
      req.flash("error", "All fields are required..!");
      // return res
      //   .status(400)
      //   .json({ success: false, message: "All fields are required" });
    }

    if (!validator.isEmail(email)) {
      req.flash("error", "Please input a valid email.");
      // return res
      //   .status(400)
      //   .json({ success: false, message: "Invalid email format" });
    }

    if (
      password.length < 6 ||
      !/[A-Z]/.test(password) ||
      !/[a-z]/.test(password) ||
      !/[0-9]/.test(password)
    ) {
      req.flash(
        "error",
        "Password must be at least 6 characters long and contain at least one uppercase letter, one lowercase letter, and one number."
      );
      // console.log("Password:", password);

      // return res.status(400).json({
      //   success: false,
      //   message:
      //     "Password must be at least 6 characters long and contain at least one uppercase letter, one lowercase letter, and one number.",
      // });
    }

    let imageUrl = "/uploads/profileImages/default.jpg";

    const profileImage = req.file;

    if (profileImage && profileImage.filename) {
      imageUrl = `/uploads/profileImages/${profileImage.filename}`;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new userModel({
      username,
      name,
      email,
      password: hashedPassword,
      profileImage: imageUrl,
    });

    const token = createToken(user);

    // Add the token to the user's tokens array
    user.tokens.push(token);

    res.cookie("jwt", token, { httpOnly: true });

    await user.save();

    req.flash(
      "success",
      "Registration complete! Redirecting to home page in a few seconds."
    );

    setTimeout(() => {
      res.redirect("/auth/home");
    }, 3000);

    // res.status(200).json({ success: true, message: "Registration complete" });

    // res.redirect("/user/home");
  } catch (error) {
    console.error("Registration failed:", error);

    req.flash("error", "Registration failed. Please try again.");

    // res.status(500).json({ success: false, message: "Registration failed" });

    res.redirect("/auth/register");
  }
};

const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await userModel.findOne({ email: email });

    if (!user) {
      req.flash("error", "Invalid email or password");
      return res.redirect("/auth/login");
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      req.flash("error", "Please check your email and password.");
      return res.redirect("/auth/login");
    }

    // Authentication successful - create and set JWT token
    const token = createToken(user);

    user.tokens.push(token);
    await user.save(); // Save the user document with the new token

    // Set req.user to the user document
    req.user = user;

    // Optionally, set the token in a cookie or send it in the response header
    res.cookie("jwt", token, { httpOnly: true });

    // Redirect to the home page or wherever you want to go after login
    return res.redirect("/auth/home");
  } catch (error) {
    console.error("An error occurred:", error);
    return next(error);
  }
};
const logoutUser = async (req, res) => {
  try {
    // Ensure that req.user is defined
    if (!req.user) {
      req.flash("error", "Logout failed. User not authenticated.");
      return res.redirect("/auth/login");
    }

    // Remove the current token from the user's tokens array if it exists
    if (req.user.tokens) {
      req.user.tokens = req.user.tokens.filter(
        (token) => token !== req.cookies.jwt
      );

      // Save the user document without the removed token
      await req.user.save();
    }

    // Clear the JWT cookie
    res.clearCookie("jwt");

    req.flash("success", "Logout successful!");
    res.redirect("/auth/login");
  } catch (error) {
    console.error("Logout failed:", error);
    req.flash("error", "Logout failed. Please try again.");
    res.redirect("/auth/home"); // Redirect to the home page or login page as needed
  }
};

const checkTokenBlacklist = (req, res, next) => {
  const token = req.cookies.jwt;

  // Check if the token is present and in the user's tokens array
  if (token && req.user?.tokens?.includes(token)) {
    console.log("Token found in the blacklist");
    return res.status(401).json({ message: "Unauthorized" });
  }

  console.log("Token not found in the blacklist");
  next();
};

module.exports = {
  registerUser,
  loginUser,
  upload,
  verifyToken,
  logoutUser,
  authMiddleware,
  checkTokenBlacklist,
};
