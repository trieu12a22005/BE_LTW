const mongoose = require("mongoose")
const docSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: false
  },
  fileUrl: {
    type: String,
    required: true
  },
  uploadedBy: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ["exam", "document"],
    required: true
  },
  category: [{
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    _id: false
  }],
  downloadCount: {
    type: Number,
    default: 0
  },
  comments: [{
    commentsId: {
      type: mongoose.Schema.Types.ObjectId,
      required: false
    },
    _id: false
  }],
  check: {
    type: String,
    enum: ["waiting", "reject", "accept"],
    default: "waiting"
  },
  ratings: [{
    idUser: {
      type: String,
      required: true
    },
    score: {
      type: Number,
      min: 1,
      max: 5,
      required: true
    },
    _id: false
  }],
  avgRating: {
    type: Number,
    default: null
  },
  countRatings: {
    type: Number,
    default: 0
  },
  views: {
    type: Number,
    default: 0
  }  
}, {
  timestamps: true
});

docSchema.methods.updateAverageRating = function () {
  const totalRatings = this.ratings.length;
  this.countRatings = totalRatings;

  if (totalRatings === 0) {
    this.avgRating = null;
  } else {
    const totalScore = this.ratings.reduce((sum, r) => sum + r.score, 0);
    this.avgRating = parseFloat((totalScore / totalRatings).toFixed(2));
  }
};

const Document = mongoose.model("Document", docSchema, "documents");
module.exports = Document