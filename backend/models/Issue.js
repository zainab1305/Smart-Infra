const mongoose = require("mongoose");

const issueSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      required: true,
    },
    location: {
      type: String,
      required: true,
    },
    imageUrl: {
      type: String,
    },
    confidenceScore: {
      type: Number,
      default: 0,
    },
    priorityScore: {
      type: Number,
      default: 0,
    },
    explanation: {
      type: String,
    },
    status: {
      type: String,
      enum: ["Reported", "Assigned", "Resolved"],
      default: "Reported",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Issue", issueSchema);
