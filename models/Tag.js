const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");
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
    postCount: Number,
    isDelete: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: { createdAt: "created_at" } }
);

TagSchema.pre("validate", function (next) {
  this.postCount = this.posts.length;
  next();
});

TagSchema.plugin(mongoosePaginate);

module.exports = Tag = mongoose.model("tags", TagSchema);
