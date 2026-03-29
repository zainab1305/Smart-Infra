const express = require("express");
const Message = require("../models/Message");
const User = require("../models/User");
const Task = require("../models/Task");
const Issue = require("../models/Issue");
const { authMiddleware } = require("../middleware/auth");

const router = express.Router();

const getSenderName = async (reqUser) => {
  if (reqUser.role === "admin") {
    return "Administrator";
  }

  const user = await User.findById(reqUser.id).select("name email");
  if (user?.name) {
    return user.name;
  }

  return reqUser.email || "Unknown";
};

const ensureIssueIsValidForWorker = async (workerId, issueId) => {
  if (!issueId) return true;

  const issueExists = await Issue.exists({ _id: issueId });
  if (!issueExists) return false;

  const assignment = await Task.findOne({ issueId, workerId }).select("_id");
  return Boolean(assignment);
};

router.get("/", authMiddleware, async (req, res) => {
  try {
    const { workerId, issueId, limit = "120" } = req.query;
    const parsedLimit = Math.min(Math.max(Number(limit) || 120, 1), 300);
    let query = {};

    if (req.user.role === "admin") {
      if (!workerId) {
        return res.status(400).json({ message: "workerId is required for admin chat" });
      }

      const workerExists = await User.exists({ _id: workerId, role: "worker", isActive: true });
      if (!workerExists) {
        return res.status(404).json({ message: "Worker not found" });
      }

      query = {
        $or: [
          { senderRole: "admin", receiverId: String(workerId), receiverRole: "worker" },
          { senderId: String(workerId), senderRole: "worker", receiverRole: "admin" },
        ],
      };

      if (issueId) {
        query.issueId = issueId;
      }
    } else if (req.user.role === "worker") {
      query = {
        $or: [
          { senderRole: "admin", receiverId: String(req.user.id), receiverRole: "worker" },
          { senderId: String(req.user.id), senderRole: "worker", receiverRole: "admin" },
        ],
      };

      if (issueId) {
        const valid = await ensureIssueIsValidForWorker(req.user.id, issueId);
        if (!valid) {
          return res.status(403).json({ message: "Access denied for this issue" });
        }
        query.issueId = issueId;
      }
    } else {
      return res.status(403).json({ message: "Only admin and worker chat is allowed" });
    }

    const messages = await Message.find(query)
      .populate("issueId", "category location address")
      .populate("taskId", "status dueDate")
      .sort({ createdAt: -1 })
      .limit(parsedLimit)
      .lean();

    res.json(messages.reverse());
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/", authMiddleware, async (req, res) => {
  try {
    const text = (req.body.text || "").trim();
    const issueId = req.body.issueId || null;

    if (!text) {
      return res.status(400).json({ message: "Message text is required" });
    }

    const senderName = await getSenderName(req.user);
    let receiverId = "";
    let receiverRole = "";

    if (req.user.role === "admin") {
      receiverId = String(req.body.receiverId || "").trim();
      receiverRole = "worker";

      if (!receiverId) {
        return res.status(400).json({ message: "receiverId is required for admin message" });
      }

      const workerExists = await User.exists({ _id: receiverId, role: "worker", isActive: true });
      if (!workerExists) {
        return res.status(404).json({ message: "Worker not found" });
      }

      if (issueId) {
        const valid = await ensureIssueIsValidForWorker(receiverId, issueId);
        if (!valid) {
          return res.status(403).json({ message: "Selected issue is not assigned to this worker" });
        }
      }
    } else if (req.user.role === "worker") {
      receiverId = "admin";
      receiverRole = "admin";

      if (issueId) {
        const valid = await ensureIssueIsValidForWorker(req.user.id, issueId);
        if (!valid) {
          return res.status(403).json({ message: "You can only tag issues assigned to you" });
        }
      }
    } else {
      return res.status(403).json({ message: "Only admin and worker chat is allowed" });
    }

    const message = new Message({
      senderId: String(req.user.id),
      senderRole: req.user.role,
      senderName,
      senderEmail: req.user.email || "",
      receiverId,
      receiverRole,
      text,
      issueId,
      taskId: req.body.taskId || null,
    });

    await message.save();

    const populatedMessage = await Message.findById(message._id)
      .populate("issueId", "category location address")
      .populate("taskId", "status dueDate");

    res.status(201).json(populatedMessage);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
