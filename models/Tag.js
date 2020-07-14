const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema;
const Schema = mongoose.Schema;

const TagSchema = new Schema({
  tag: {
    type: String,
    unique: true,
    required: true,
  },
  posts: [{ type: ObjectId, ref: "posts" }],
  timestamp: {
    type: Date,
    default: Date.now,
  },
  isDelete: {
    type: Boolean,
    default: false,
  },
});

module.exports = Tag = mongoose.model("tags", TagSchema);
