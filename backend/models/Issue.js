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
    address: {
      type: String,
      default: "",
    },
    latitude: {
      type: Number,
      default: null,
    },
    longitude: {
      type: Number,
      default: null,
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
    repeatComplaintCount: {
      type: Number,
      default: 1,
    },
    explanation: {
      type: String,
    },
    status: {
      type: String,
      enum: [
        "Reported",
        "Scheduled",
        "In Progress",
        "Completed",
        "Rejected",
        // Legacy values preserved for older records.
        "Assigned",
        "Resolved",
      ],
      default: "Reported",
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Issue", issueSchema);
