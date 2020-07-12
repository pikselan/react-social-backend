const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema;
const Schema = mongoose.Schema;

const TrendingSchema = new Schema({
  text: {
    type: String,
    required: true,
  },
  posts: [
    {
      type: ObjectId,
      ref: "Post",
    },
  ],
});

module.exports = Trending = mongoose.model("trendings", TrendingSchema);
