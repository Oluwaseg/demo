const authController = require("../controllers/authController");
const express = require("express");
const router = express.Router();

router.post("/login", authController.loginUser);
router.post("/register", authController.registerUser);

router.get("/register", (req, res) => {
  res.render("register.ejs");
});

router.get("/login", (req, res) => {
  res.render("login.ejs");
});

router.post(
  "/register",
  authController.upload.single("profileImage"),
  authController.registerUser
);

module.exports = router;
