const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema;
const Schema = mongoose.Schema;

const PostSchema = new Schema({
  user: {
    type: ObjectId,
    ref: "User",
    required: true,
  },
  text: {
    type: String,
    required: true,
  },
  image: {
    type: String,
  },
  comments: [
    {
      user: {
        type: ObjectId,
        ref: "User",
      },
      text: {
        type: String,
      },
      timestamp: {
        type: Date,
      },
    },
  ],
  tag: [
    {
      text: {
        type: String,
      },
    },
  ],
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

module.exports = Post = mongoose.model("posts", PostSchema);
