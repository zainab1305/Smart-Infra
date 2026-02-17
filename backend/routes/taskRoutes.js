const express = require("express");
const Task = require("../models/Task");
const Issue = require("../models/Issue");
const WeeklyReport = require("../models/WeeklyReport");
const { authMiddleware, adminOnly, workerOrAdmin } = require("../middleware/auth");

const router = express.Router();

// Get current week number
const getCurrentWeek = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const diff = now - start;
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay / 7) + 1;
};

// Admin: Assign task to worker
router.post("/assign", authMiddleware, adminOnly, async (req, res) => {
  try {
    const { issueId, workerId, dueDate } = req.body;

    const issue = await Issue.findById(issueId);
    if (!issue) {
      return res.status(404).json({ message: "Issue not found" });
    }

    const weekNumber = getCurrentWeek();
    const year = new Date().getFullYear();

    const task = new Task({
      issueId,
      workerId,
      assignedDate: new Date(),
      dueDate,
      status: "Pending",
      weekNumber,
      year,
    });

    await task.save();

    // Update issue status
    await Issue.findByIdAndUpdate(issueId, { status: "Assigned" });

    res.status(201).json({
      message: "Task assigned successfully",
      task: await task.populate(["issueId", "workerId"]),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Worker: Get assigned tasks
router.get("/my-tasks", authMiddleware, workerOrAdmin, async (req, res) => {
  try {
    const workerId = req.user.id;
    const weekNumber = getCurrentWeek();
    const year = new Date().getFullYear();

    const tasks = await Task.find({ workerId, weekNumber, year })
      .populate("issueId")
      .populate("workerId")
      .sort({ assignedDate: -1 });

    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Worker: Respond to task (accept/reject)
router.put("/:taskId/respond", authMiddleware, workerOrAdmin, async (req, res) => {
  try {
    const { accepted, feedback } = req.body;
    const task = await Task.findById(req.params.taskId);

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    if (task.workerId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const newStatus = accepted ? "In Progress" : "Rejected";

    const updatedTask = await Task.findByIdAndUpdate(
      req.params.taskId,
      {
        status: newStatus,
        workerResponse: {
          accepted,
          feedback,
          responseDate: new Date(),
        },
      },
      { new: true }
    );

    // If rejected, revert issue status
    if (!accepted) {
      await Issue.findByIdAndUpdate(task.issueId, { status: "Reported" });
    }

    res.json({
      message: "Task response recorded",
      task: await updatedTask.populate(["issueId", "workerId"]),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Worker: Complete task
router.put("/:taskId/complete", authMiddleware, workerOrAdmin, async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId);

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    if (task.workerId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const updatedTask = await Task.findByIdAndUpdate(
      req.params.taskId,
      { status: "Completed" },
      { new: true }
    );

    // Update issue status
    await Issue.findByIdAndUpdate(task.issueId, { status: "Resolved" });

    res.json({
      message: "Task completed",
      task: await updatedTask.populate(["issueId", "workerId"]),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin: Get all tasks for a specific week
router.get("/week/:weekNumber", authMiddleware, adminOnly, async (req, res) => {
  try {
    const { weekNumber } = req.params;
    const year = new Date().getFullYear();

    const tasks = await Task.find({ weekNumber: Number(weekNumber), year })
      .populate("issueId")
      .populate("workerId")
      .sort({ assignedDate: -1 });

    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin: Get dashboard data (all workers' weekly reports)
router.get("/dashboard/week-summary", authMiddleware, adminOnly, async (req, res) => {
  try {
    const weekNumber = getCurrentWeek();
    const year = new Date().getFullYear();

    const tasks = await Task.find({ weekNumber, year })
      .populate("workerId")
      .populate("issueId");

    const workerStats = {};

    tasks.forEach((task) => {
      const workerId = task.workerId._id.toString();
      if (!workerStats[workerId]) {
        workerStats[workerId] = {
          worker: task.workerId,
          totalTasks: 0,
          completed: 0,
          inProgress: 0,
          pending: 0,
          rejected: 0,
          tasks: [],
        };
      }
      workerStats[workerId].totalTasks++;
      workerStats[workerId][task.status.toLowerCase()] =
        (workerStats[workerId][task.status.toLowerCase()] || 0) + 1;
      workerStats[workerId].tasks.push({
        id: task._id,
        issue: task.issueId,
        status: task.status,
        dueDate: task.dueDate,
      });
    });

    res.json({
      weekNumber,
      year,
      summary: Object.values(workerStats),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
