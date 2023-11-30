const express = require("express");
const router = express.Router();

// Import user routes
const userRoutes = require("../routes/userRoutes.js");
router.use("/users", userRoutes);

// Define route for the root path
router.get("/", (req, res) => {
  // Handle the root path (e.g., render a template)
  res.render("index.ejs");
});

module.exports = router;
