const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    senderId: {
      type: String,
      required: true,
      trim: true,
    },
    senderRole: {
      type: String,
      enum: ["admin", "worker", "user"],
      required: true,
    },
    senderName: {
      type: String,
      required: true,
      trim: true,
    },
    senderEmail: {
      type: String,
      default: "",
      trim: true,
    },
    receiverId: {
      type: String,
      default: "",
      trim: true,
    },
    receiverRole: {
      type: String,
      enum: ["", "admin", "worker", "user"],
      default: "",
    },
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    issueId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Issue",
      default: null,
    },
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Message", messageSchema);
