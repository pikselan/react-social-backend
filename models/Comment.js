const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema;
const Schema = mongoose.Schema;

const CommentSchema = new Schema({
  postId: {
    type: ObjectId,
    ref: "Post",
    required: true,
  },
  user: {
    type: ObjectId,
    ref: "User",
    required: true,
  },
  text: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  isDelete: {
    type: Boolean,
    default: false,
  },
});

module.exports = Comment = mongoose.model("comments", CommentSchema);
