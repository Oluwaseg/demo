const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");

// Routes
router.get("/home", userController.getHome);
router.get("/about", userController.getAbout);
router.get("/features", userController.getFeatures);
router.get("/logout", userController.getLogout);

module.exports = router;
