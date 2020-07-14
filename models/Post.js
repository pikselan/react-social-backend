const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema;
const Schema = mongoose.Schema;

const PostSchema = new Schema({
  userId: {
    type: ObjectId,
    ref: "users",
    required: true,
  },
  text: {
    type: String,
    required: true,
  },
  image: {
    type: String,
  },
  tags: [{ type: ObjectId, ref: "tags" }],
  comments: [{ type: ObjectId, ref: "comments" }],
  timestamp: {
    type: Date,
    default: Date.now,
  },
  isDelete: {
    type: Boolean,
    default: false,
  },
});

module.exports = Post = mongoose.model("posts", PostSchema);
