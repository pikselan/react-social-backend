const express = require("express");
const router = express.Router();

const apiController = require("../controllers/apiController");

router.get("/", function (req, res, next) {
  res.redirect("/");
});

router.post("/register", apiController.registerUser);
router.post("/login", apiController.loginUser);
router.get("/@/:id", apiController.getUser);
router.post("/post", apiController.addPost);

module.exports = router;
