const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
  {
    issueId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Issue",
      required: true,
    },
    workerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    assignedDate: {
      type: Date,
      required: true,
    },
    dueDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: ["Pending", "In Progress", "Completed", "Rejected"],
      default: "Pending",
    },
    workerResponse: {
      accepted: {
        type: Boolean,
      },
      feedback: {
        type: String,
      },
      responseDate: {
        type: Date,
      },
    },
    weekNumber: {
      type: Number,
    },
    year: {
      type: Number,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Task", taskSchema);
