import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import validator from "validator";
import path from "path";
import userModel from "../models/userModel.js";

const secretKey = process.env.JWT_SECRET; // Retrieve secret key from .env

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

exports.registerUser = async (req, res) => {
  try {
    const { name, email, password, username } = req.body;
    // Check if email or username already exist
    const existingUser = await userModel.findOne({
      $or: [{ email: email }, { username: username }],
    });

    if (existingUser) {
      if (existingUser.email === email) {
        return res.status(400).json("User with the given email already exists");
      } else {
        return res
          .status(400)
          .json("User with the given username already exists");
      }
    }

    if (!name || !email || !password || !username) {
      return res.status(400).json("All fields are required..!");
    }

    if (!validator.isEmail(email)) {
      return res.status(400).json("Please input a valid email.");
    }
    if (!validator.isStrongPassword(password)) {
      return res.status(400).json("Password must be strong.");
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
    req.flash(
      "success",
      "Registration complete! Redirecting to login in a few seconds."
    );

    // Add a delay (e.g., 3 seconds) using JavaScript
    const delayInSeconds = 3;
    setTimeout(() => res.redirect("/login"), delayInSeconds * 1000);
  } catch (error) {
    console.error("Registration failed:", error);
    req.flash("error", "Registration failed. Please try again.");
    res.redirect("/register");
  }
};

exports.loginUser = async (req, res, next) => {
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
