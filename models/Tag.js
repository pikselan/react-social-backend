const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema;
const Schema = mongoose.Schema;

const TagSchema = new Schema(
  {
    tag: {
      type: String,
      unique: true,
      required: true,
    },
    posts: [{ type: ObjectId, ref: "posts" }],
    isDelete: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: { createdAt: "created_at" } }
);

module.exports = Tag = mongoose.model("tags", TagSchema);
