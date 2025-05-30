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
  }
}, {
  timestamps: true
});

docSchema.methods.updateAverageRating = function () {
  if (this.ratings.length === 0) {
    this.avgRating = null;
  } else {
    const total = this.ratings.reduce((sum, r) => sum + r.score, 0);
    this.avgRating = parseFloat((total / this.ratings.length).toFixed(2));
  }
};

const Document = mongoose.model("Document", docSchema, "documents");
module.exports = Document