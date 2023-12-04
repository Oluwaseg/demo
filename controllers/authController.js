const path = require("path");
const bcrypt = require("bcrypt");
const validator = require("validator");
const userModel = require("../models/userModel");
const jwt = require("jsonwebtoken");
const multer = require("multer");

const secretKey = process.env.JWT_SECRET;

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/uploads");
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
  };

  const token = jwt.sign(tokenData, secretKey, { expiresIn: "1h" });
  return token;
};

const registerUser = async (req, res) => {
  try {
    console.log("Request body:", req.body);
    console.log("Request file:", req.file);
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
    }

    if (!name || !email || !password || !username) {
      req.flash("error", "All fields are required..!");
      // res.redirect("/user/register");
    }

    if (!validator.isEmail(email)) {
      req.flash("error", "Please input a valid email.");
    }

    if (!validator.isStrongPassword(password)) {
      req.flash(
        "error",
        "Password must be at least 6 characters long and contain at least one uppercase letter, one lowercase letter, and one number."
      );
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

    // Flash message and redirect with a delay
    // Redirect only if there are no errors
    if (!req.flash("error").length) {
      console.log("No errors. Redirecting now...");
      req.flash(
        "success",
        "Registration complete! Redirecting to login in a few seconds."
      );
      const delayInSeconds = 3;
      setTimeout(() => {
        res.redirect("/auth/login");
      }, delayInSeconds * 1000);
    } else {
      console.log("Errors detected. Redirecting back to registration...");
      res.redirect("/auth/register");
    }
  } catch (error) {
    console.error("Registration failed:", error);
    req.flash("error", "Registration failed. Please try again.");
    res.redirect("/auth/register");
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await userModel.findOne({ email: email });

    if (!user) {
      req.flash("error", "Invalid email or password");
      res.redirect("/auth/login");
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      req.flash("error", "Please check your email and password.");
      res.redirect("/auth/login");
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

module.exports = {
  registerUser,
  loginUser,
  upload,
};
