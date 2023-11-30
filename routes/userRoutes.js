const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const upload = require("multer")(); // Ensure you use multer appropriately

// Routes
router.get("/", userController.getIndex);
router.get("/home", userController.getHome);
router.get("/about", userController.getAbout);
router.get("/features", userController.getFeatures);
router.get("/login", userController.getLogin);
router.get("/register", userController.getRegister);
router.get("/logout", userController.getLogout);

router.post("/logout", userController.postLogout);
router.post(
  "/register",
  upload.single("profileImage"),
  userController.postRegister
);
router.post("/login", userController.postLogin);

module.exports = router;
