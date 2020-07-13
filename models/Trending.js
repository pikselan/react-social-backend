const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema;
const Schema = mongoose.Schema;

const TrendingSchema = new Schema({
  text: {
    type: String,
    unique: true,
    required: true,
  },
  posts: [
    {
      type: ObjectId,
      ref: "posts",
      required: true,
    },
  ],
  timestamp: {
    type: Date,
    default: Date.now,
  },
  isDelete: {
    type: Boolean,
    default: false,
  },
});

module.exports = Trending = mongoose.model("trendings", TrendingSchema);
