const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const keys = require("../config/keys");

const User = require("../models/User");
const Post = require("../models/Post");
const Comment = require("../models/Comment");
const Tag = require("../models/Tag");

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
      const { text } = req.body;
      let tags = [];
      if (req.body.tags) {
        tags = req.body.tags.split(",");
      }

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

      let newPost;
      if (req.files) {
        const imageFile = req.files.image;
        const imagePath = `images/posts/${imageFile.name}`;
        imageFile.mv(`public/${imagePath}`, (err) => {
          if (err) {
            console.log(err);
            res
              .status(500)
              .json({ message: "Internal server error", error: err });
          }
        });

        newPost = await Post.create({
          userId: decoded.id,
          text,
          image: imagePath,
        });
      } else {
        newPost = await Post.create({
          userId: decoded.id,
          text,
        });
      }

      tags.map(async (data, index) => {
        await Tag.findOne({ tag: data })
          .then(async (tag) => {
            if (tag) {
              tag.posts.push(newPost._id);
              await tag
                .save()
                .then((updateTag) => newPost.tags.push(updateTag._id));
            } else {
              await Tag.create({
                tag: data,
                posts: [newPost._id],
              }).then((newTag) => newPost.tags.push(newTag._id));
            }
          })
          .then(async () => {
            if (newPost.tags.length === tags.length) {
              // console.log(newPost.tags);
              await newPost.save();
            }
          });
      });

      newPost = await newPost
        .populate({ path: "userId", select: "username name photo -_id" })
        .populate({
          path: "comments",
          select: "text userId created_at",
          populate: { path: "userId", select: "username -_id" },
          match: { isDelete: false },
          limit: 5,
        })
        .populate({
          path: "tags",
          select: "tag",
          match: { isDelete: false },
        })
        .execPopulate();

      res.status(200).json(newPost);
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
      const page = req.params.page || 1;
      if (!req.headers.authorization) {
        return res.status(404).json({ auth: "require authorization" });
      } else if (verifyToken(req.headers.authorization)) {
        return res.status(404).json({ auth: "error authorization" });
      }

      const data = await Post.paginate(
        { isDelete: false },
        {
          page,
          limit: 10,
          select: "-isDelete -__v -updatedAt",
          sort: { created_at: -1 },
          populate: [
            {
              path: "comments",
              select: "text userId created_at",
              sort: { created_at: -1 },
              populate: { path: "userId", select: "username -_id" },
              limit: 4,
              match: { isDelete: false },
            },
            {
              path: "userId",
              select: "username name photo -_id",
              match: { isDelete: false },
            },
            { path: "tags", select: "tag", match: { isDelete: false } },
          ],
        }
      );

      res.status(200).json(data);
    } catch (err) {
      res.status(500).json({ message: "Internal server error", error: err });
    }
  },
  getUserPost: async (req, res) => {
    try {
      const username = req.params.username;
      const page = req.params.page || 1;
      if (!req.headers.authorization) {
        return res.status(404).json({ auth: "require authorization" });
      } else if (verifyToken(req.headers.authorization)) {
        return res.status(404).json({ auth: "error authorization" });
      }

      await User.findOne({ username }).then(async (user) => {
        const data = await Post.paginate(
          { userId: `${user._id}`, isDelete: false },
          {
            page,
            limit: 10,
            select: "-isDelete -__v -updatedAt",
            sort: { created_at: -1 },
            populate: [
              {
                path: "comments",
                select: "text userId created_at",
                sort: { created_at: -1 },
                populate: { path: "userId", select: "username -_id" },
                limit: 4,
                match: { isDelete: false },
              },
              {
                path: "userId",
                select: "username name photo -_id",
                match: { isDelete: false },
              },
              { path: "tags", select: "tag", match: { isDelete: false } },
            ],
          }
        );

        res.status(200).json(data);
      });
    } catch (err) {
      res.status(500).json({ message: "Internal server error", error: err });
    }
  },
  getAllTag: async (req, res) => {
    try {
      const page = req.params.page || 1;
      const tag = req.params.tag;
      if (!req.headers.authorization) {
        return res.status(404).json({ auth: "require authorization" });
      } else if (verifyToken(req.headers.authorization)) {
        return res.status(404).json({ auth: "error authorization" });
      }

      const data = await Tag.paginate(
        { tag: `#${tag}`, isDelete: false },
        {
          page,
          limit: 10,
          select: "-isDelete -__v -updatedAt",
          sort: { created_at: -1 },
          populate: [
            {
              path: "posts",
              select: "-isDelete -__v -updatedAt -tags",
              sort: { created_at: -1 },
              populate: [
                {
                  path: "comments",
                  select: "text userId created_at",
                  sort: { created_at: -1 },
                  populate: { path: "userId", select: "username -_id" },
                  limit: 4,
                  match: { isDelete: false },
                },
                {
                  path: "userId",
                  select: "username name photo -_id",
                  match: { isDelete: false },
                },
              ],
            },
          ],
        }
      );

      res.status(200).json(data);
    } catch (err) {
      res.status(500).json({ message: "Internal server error", error: err });
    }
  },
  getListTag: async (req, res) => {
    try {
      if (!req.headers.authorization) {
        return res.status(404).json({ auth: "require authorization" });
      } else if (verifyToken(req.headers.authorization)) {
        return res.status(404).json({ auth: "error authorization" });
      }

      const data = await Tag.find()
        .select("-_id -isDelete -__v -posts -created_at")
        .limit(10)
        .sort({ postCount: -1, updatedAt: -1 });

      res.status(200).json(data);
    } catch (err) {
      res.status(500).json({ message: "Internal server error", error: err });
    }
  },
};
