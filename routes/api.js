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
router.post("/comment", apiController.addComment);
router.get("/posts", apiController.getAllPost);
router.get("/posts/:page", apiController.getAllPost);
router.get("/tags/:tag", apiController.getAllTag);
router.get("/tags/:tag/:page", apiController.getAllTag);
router.get("/tag", apiController.getListTag);

module.exports = router;
