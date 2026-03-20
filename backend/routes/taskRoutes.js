const express = require("express");
const Task = require("../models/Task");
const Issue = require("../models/Issue");
const WeeklyReport = require("../models/WeeklyReport");
const { authMiddleware, adminOnly, workerOrAdmin } = require("../middleware/auth");
const { autoScheduleIssues } = require("../services/schedulingService");

const router = express.Router();

// Get current week number
const getCurrentWeek = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const diff = now - start;
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay / 7) + 1;
};

// Get date range for predefined report durations.
const getDurationRange = (duration = "week") => {
  const endDate = new Date();
  endDate.setHours(23, 59, 59, 999);

  const startDate = new Date(endDate);
  if (duration === "month") {
    startDate.setDate(startDate.getDate() - 29);
  } else {
    startDate.setDate(startDate.getDate() - 6);
  }
  startDate.setHours(0, 0, 0, 0);

  return { startDate, endDate };
};

// Admin: Assign task to worker
router.post("/assign", authMiddleware, adminOnly, async (req, res) => {
  try {
    const { issueId, workerId, dueDate } = req.body;

    const issue = await Issue.findById(issueId);
    if (!issue) {
      return res.status(404).json({ message: "Issue not found" });
    }

    if (issue.status !== "Reported") {
      return res.status(400).json({ message: "Only reported issues can be scheduled" });
    }

    const weekNumber = getCurrentWeek();
    const year = new Date().getFullYear();

    const task = new Task({
      issueId,
      workerId,
      assignedDate: new Date(),
      dueDate,
      status: "Scheduled",
      weekNumber,
      year,
    });

    await task.save();

    // Update issue status
    await Issue.findByIdAndUpdate(issueId, { status: "Scheduled" });

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

    const tasks = await Task.find({ workerId })
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

    if (!["Scheduled", "Pending"].includes(task.status)) {
      return res.status(400).json({ message: "Task can only be accepted or rejected from Scheduled state" });
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

    // Keep rejected tasks in lifecycle history.
    if (!accepted) {
      await Issue.findByIdAndUpdate(task.issueId, { status: "Rejected" });
    } else {
      await Issue.findByIdAndUpdate(task.issueId, { status: "In Progress" });
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

    if (task.status !== "In Progress") {
      return res.status(400).json({ message: "Only in-progress tasks can be completed" });
    }

    const updatedTask = await Task.findByIdAndUpdate(
      req.params.taskId,
      { status: "Completed" },
      { new: true }
    );

    // Update issue status
    await Issue.findByIdAndUpdate(task.issueId, { status: "Completed" });

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
          scheduled: 0,
          rejected: 0,
          tasks: [],
        };
      }
      workerStats[workerId].totalTasks++;
      
      // Normalize legacy and current status values to dashboard keys.
      const statusKey =
        task.status === "In Progress"
          ? "inProgress"
          : task.status === "Pending" || task.status === "Scheduled"
            ? "scheduled"
            : task.status.toLowerCase();

      workerStats[workerId][statusKey] =
        (workerStats[workerId][statusKey] || 0) + 1;
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

// Admin: Get diagnostic info (debug issues)
router.get("/diagnostic/status", authMiddleware, adminOnly, async (req, res) => {
  try {
    const issuesByStatus = await Issue.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ]);

    const workers = await User.find({ role: "worker" }).select("_id name email isActive workerId");
    const activeWorkers = workers.filter(w => w.isActive);

    res.json({
      issuesByStatus,
      totalIssues: await Issue.countDocuments(),
      totalWorkers: workers.length,
      activeWorkers: activeWorkers.length,
      workers: workers.map(w => ({
        id: w._id,
        name: w.name,
        email: w.email,
        workerId: w.workerId,
        isActive: w.isActive
      }))
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin: Get predefined report summary for week/month duration.
router.get("/report-summary", authMiddleware, adminOnly, async (req, res) => {
  try {
    const duration = req.query.duration === "month" ? "month" : "week";
    const { startDate, endDate } = getDurationRange(duration);

    const tasks = await Task.find({
      assignedDate: {
        $gte: startDate,
        $lte: endDate,
      },
    })
      .populate("workerId", "name workerId")
      .populate("issueId", "category location");

    const totals = {
      assigned: tasks.length,
      completed: 0,
      inProgress: 0,
      scheduled: 0,
      rejected: 0,
    };

    const workerBreakdown = {};

    tasks.forEach((task) => {
      const statusBucket =
        task.status === "Completed"
          ? "completed"
          : task.status === "In Progress"
            ? "inProgress"
            : task.status === "Rejected"
              ? "rejected"
              : "scheduled";

      totals[statusBucket] += 1;

      const workerKey = task.workerId?._id?.toString() || "unassigned";
      if (!workerBreakdown[workerKey]) {
        workerBreakdown[workerKey] = {
          workerName: task.workerId?.name || "Unknown Worker",
          workerCode: task.workerId?.workerId || "N/A",
          assigned: 0,
          completed: 0,
          inProgress: 0,
          scheduled: 0,
          rejected: 0,
        };
      }

      workerBreakdown[workerKey].assigned += 1;
      workerBreakdown[workerKey][statusBucket] += 1;
    });

    const completionRate = totals.assigned
      ? Number(((totals.completed / totals.assigned) * 100).toFixed(2))
      : 0;

    res.json({
      duration,
      period: {
        startDate,
        endDate,
      },
      generatedAt: new Date(),
      totals: {
        ...totals,
        completionRate,
      },
      workers: Object.values(workerBreakdown).sort((a, b) => b.assigned - a.assigned),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin: Auto-schedule unassigned issues to available workers
router.post("/auto-schedule", authMiddleware, adminOnly, async (req, res) => {
  console.log("[AUTO-SCHEDULE] Request received from user:", req.user?.id);
  try {
    const result = await autoScheduleIssues();
    console.log("[AUTO-SCHEDULE] Result:", result);
    
    if (result.success) {
      return res.status(200).json({
        message: result.message,
        scheduledCount: result.scheduled,
        totalUnassigned: result.total,
        availableWorkers: result.workers,
        details: result.details
      });
    } else {
      console.log("[AUTO-SCHEDULE] Failed - returning 400");
      return res.status(400).json({
        message: result.message,
        error: result.error,
        scheduledCount: result.scheduled
      });
    }
  } catch (error) {
    console.error("[AUTO-SCHEDULE] Exception caught:", error);
    return res.status(500).json({ message: `Server error: ${error.message}` });
  }
});

module.exports = router;
