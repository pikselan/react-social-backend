const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema;
const Schema = mongoose.Schema;

const CommentSchema = new Schema(
  {
    postId: {
      type: ObjectId,
      ref: "posts",
      required: true,
    },
    userId: {
      type: ObjectId,
      ref: "users",
      required: true,
    },
    text: {
      type: String,
      required: true,
    },
    isDelete: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: { createdAt: "created_at" } }
);

module.exports = Comment = mongoose.model("comments", CommentSchema);
