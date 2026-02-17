const mongoose = require("mongoose");

const weeklyReportSchema = new mongoose.Schema(
  {
    workerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    weekNumber: {
      type: Number,
      required: true,
    },
    year: {
      type: Number,
      required: true,
    },
    tasksCompleted: {
      type: Number,
      default: 0,
    },
    tasksPending: {
      type: Number,
      default: 0,
    },
    tasksRejected: {
      type: Number,
      default: 0,
    },
    totalTasks: {
      type: Number,
      default: 0,
    },
    completionRate: {
      type: Number,
      default: 0,
    },
    summary: {
      type: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("WeeklyReport", weeklyReportSchema);
