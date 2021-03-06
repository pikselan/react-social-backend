const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");
const { ObjectId } = mongoose.Schema;
const Schema = mongoose.Schema;

const PostSchema = new Schema(
  {
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
    commentCount: Number,
    isDelete: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: { createdAt: "created_at" } }
);

PostSchema.pre("validate", function (next) {
  this.commentCount = this.comments.length;
  next();
});

PostSchema.plugin(mongoosePaginate);

module.exports = Post = mongoose.model("posts", PostSchema);
