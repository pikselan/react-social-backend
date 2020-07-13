const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const keys = require("../config/keys");

const User = require("../models/User");
const Post = require("../models/Post");
const Comment = require("../models/Comment");
const Trending = require("../models/Trending");

const validateRegisterInput = require("../validation/register");
const validateLoginInput = require("../validation/login");
const { secretOrKey } = require("../config/keys");

const verifyToken = (data) => {
  const token = data.replace("Bearer ", "");
  return jwt.verify(token, secretOrKey, (err, data) => (err ? true : false));
};

module.exports = {
  registerUser: async (req, res) => {
    try {
      const { errors, isValid } = validateRegisterInput(req.body);

      if (!isValid) {
        return res.status(400).json(errors);
      }

      await User.findOne({ email: req.body.email }).then((user) => {
        if (user) {
          return res.status(400).json({ email: "Email already exists" });
        } else {
          const newUser = new User({
            name: req.body.name,
            username:
              req.body.name
                .toLowerCase()
                .replace(/[^A-Z0-9]+/gi, "_")
                .substring(0, 15) + Math.random().toFixed(5).substr(2),
            email: req.body.email,
            password: req.body.password,
          });

          bcrypt.genSalt(10, (err, salt) => {
            bcrypt.hash(newUser.password, salt, async (err, hash) => {
              if (err) throw err;
              newUser.password = hash;
              await newUser
                .save()
                .then((user) => res.json(user))
                .catch((err) => console.log(err));
            });
          });
        }
      });
    } catch (err) {
      res.status(500).json({ message: "Internal server error", error: err });
    }
  },
  loginUser: async (req, res) => {
    try {
      const { errors, isValid } = validateLoginInput(req.body);

      if (!isValid) {
        return res.status(400).json(errors);
      }

      const { email, password } = req.body;

      await User.findOne({ email }).then((user) => {
        if (!user) {
          return res.status(404).json({ email: "Email not found" });
        }

        bcrypt.compare(password, user.password).then((isMatch) => {
          if (isMatch) {
            const payload = {
              id: user.id,
              user: {
                email: user.email,
                username: user.username,
                name: user.name,
                photo: user.photo,
                bio: user.bio,
              },
            };

            jwt.sign(
              payload,
              keys.secretOrKey,
              {
                expiresIn: 4 * 7 * 24 * 60 * 60, // 1 month
                // expiresIn: 5, // 1 month
              },
              (err, token) => {
                res.json({
                  success: true,
                  token: "Bearer " + token,
                });
              }
            );
          } else {
            return res.status(404).json({ password: "Password incorrect" });
          }
        });
      });
    } catch (err) {
      res.status(500).json({ message: "Internal server error", error: err });
    }
  },
  getUser: async (req, res) => {
    try {
      const username = req.params.id;

      if (!req.headers.authorization) {
        return res.status(404).json({ auth: "require authorization" });
      } else if (verifyToken(req.headers.authorization)) {
        return res.status(404).json({ auth: "error authorization" });
      }

      await User.findOne({ username }).then((user) => {
        if (!user) {
          return res.status(404).json({ user: "user not found" });
        }
        return res.status(200).json({
          email: user.email,
          username: user.username,
          name: user.name,
          photo: user.photo,
          bio: user.bio,
        });
      });
    } catch (err) {
      res.status(500).json({ message: "Internal server error", error: err });
    }
  },
  addPost: async (req, res) => {
    try {
      const { text, image, tags } = req.body;

      if (!req.headers.authorization) {
        return res.status(404).json({ auth: "require authorization" });
      }

      const decoded = jwt.verify(
        req.headers.authorization.replace("Bearer ", ""),
        secretOrKey,
        (err, decoded) => {
          if (err) {
            res.status(404).json({ auth: "error authorization" });
          }
          return decoded;
        }
      );

      const newPost = new Post({
        userId: decoded.id,
        text,
        image,
        tags,
      });

      await newPost.save().then((post) => res.json(post));
    } catch (err) {
      res.status(500).json({ message: "Internal server error", error: err });
    }
  },
  addComment: async (req, res) => {
    try {
      const { postId, text } = req.body;

      if (!req.headers.authorization) {
        return res.status(404).json({ auth: "require authorization" });
      }

      const decoded = jwt.verify(
        req.headers.authorization.replace("Bearer ", ""),
        secretOrKey,
        (err, decoded) => {
          if (err) {
            res.status(404).json({ auth: "error authorization" });
          }
          return decoded;
        }
      );

      const newComment = await Comment.create({
        userId: decoded.id,
        text,
        postId,
      });

      const addCommentToPost = await Post.findById(postId);
      addCommentToPost.comments.push(newComment._id);
      await addCommentToPost.save();
      res.status(200).json(newComment);
    } catch (err) {
      res.status(500).json({ message: "Internal server error", error: err });
    }
  },
  getAllPost: async (req, res) => {
    try {
      if (!req.headers.authorization) {
        return res.status(404).json({ auth: "require authorization" });
      } else if (verifyToken(req.headers.authorization)) {
        return res.status(404).json({ auth: "error authorization" });
      }

      const data = await Post.find()
        .select("-isDelete -__v")
        .populate({ path: "userId", select: "username -_id" })
        .populate({
          path: "comments",
          select: "id text userId timestamp",
          populate: { path: "userId", select: "username -_id" },
        });

      res.status(200).json(data);
    } catch (err) {
      res.status(500).json({ message: "Internal server error", error: err });
    }
  },
};
