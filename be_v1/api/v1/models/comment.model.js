const mongoose = require("mongoose")
const CommentSchema = new mongoose.Schema(
  {
    toDocOrPost: {type: String, require: true}, // id cua document or id cua post
    idUser: {type: String, require: true},
    content: {type: String, require: true},
    toReply: {type: String, require: false},
    isDelete: {type: Boolean, default: false, require: false}
  },
  { timestamps: true }
);
const Comment  = mongoose.model("Comment", CommentSchema, "comments");
module.exports= Comment