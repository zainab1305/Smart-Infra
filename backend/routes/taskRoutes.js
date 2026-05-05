const express = require("express");
const Task = require("../models/Task");
const Issue = require("../models/Issue");
const WeeklyReport = require("../models/WeeklyReport");
const { authMiddleware, adminOnly, workerOrAdmin } = require("../middleware/auth");
const { autoScheduleIssues } = require("../services/schedulingService");

const router = express.Router();

const normalizeLocation = (value = "") => value.replace(/\s+/g, " ").trim();

const tokenizeLocation = (value = "") =>
  normalizeLocation(value)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);

const isSimilarArea = (locationA = "", locationB = "") => {
  const normalizedA = normalizeLocation(locationA).toLowerCase();
  const normalizedB = normalizeLocation(locationB).toLowerCase();

  if (!normalizedA || !normalizedB) return false;
  if (normalizedA === normalizedB) return true;

  if (normalizedA.includes(normalizedB) || normalizedB.includes(normalizedA)) {
    return true;
  }

  const tokensA = tokenizeLocation(normalizedA);
  const tokensB = tokenizeLocation(normalizedB);
  if (!tokensA.length || !tokensB.length) return false;

  const setA = new Set(tokensA);
  const setB = new Set(tokensB);
  const intersection = [...setA].filter((token) => setB.has(token)).length;
  const union = new Set([...setA, ...setB]).size;
  const jaccard = union > 0 ? intersection / union : 0;

  return jaccard >= 0.6;
};

const getRelatedIssueIds = async (baseIssue) => {
  const sameCategoryIssues = await Issue.find({ category: baseIssue.category }).select("_id location");

  return sameCategoryIssues
    .filter((issue) => isSimilarArea(issue.location, baseIssue.location))
    .map((issue) => issue._id);
};

const syncRelatedIssueStatuses = async ({ baseIssue, nextStatus, fromStatuses }) => {
  const relatedIssueIds = await getRelatedIssueIds(baseIssue);

  if (!relatedIssueIds.length) {
    return 0;
  }

  const updateResult = await Issue.updateMany(
    {
      _id: { $in: relatedIssueIds },
      status: { $in: fromStatuses },
    },
    { status: nextStatus }
  );

  return updateResult.modifiedCount || 0;
};

const groupActiveTasksByArea = (tasks = []) => {
  const grouped = [];

  tasks.forEach((task) => {
    if (!task.issueId?.category || !task.issueId?.location) {
      return;
    }

    const existingGroup = grouped.find(
      (group) =>
        group.category === task.issueId.category &&
        isSimilarArea(group.representativeLocation, task.issueId.location)
    );

    if (existingGroup) {
      existingGroup.tasks.push(task);
      return;
    }

    grouped.push({
      category: task.issueId.category,
      representativeLocation: task.issueId.location,
      tasks: [task],
    });
  });

  return grouped;
};

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

    const relatedIssueIds = await getRelatedIssueIds(issue);
    const existingActiveTask = await Task.findOne({
      issueId: { $in: relatedIssueIds },
      status: { $in: ["Scheduled", "In Progress", "Pending"] },
    }).select("_id issueId status");

    if (existingActiveTask) {
      return res.status(400).json({
        message: "A task is already active for this location group",
        existingTaskId: existingActiveTask._id,
      });
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

    // Keep grouped complaints in sync so all reporting users see the same status.
    const syncedIssues = await syncRelatedIssueStatuses({
      baseIssue: issue,
      nextStatus: "Scheduled",
      fromStatuses: ["Reported"],
    });

    res.status(201).json({
      message:
        syncedIssues > 1
          ? `Task assigned successfully. Synced ${syncedIssues} related issues to Scheduled.`
          : "Task assigned successfully",
      task: await task.populate(["issueId", "workerId"]),
      syncedIssues,
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

// Admin: Get issues assigned to a specific worker (for worker-specific chat issue tagging)
router.get("/worker/:workerId/issues", authMiddleware, adminOnly, async (req, res) => {
  try {
    const { workerId } = req.params;

    const tasks = await Task.find({ workerId })
      .populate("issueId")
      .sort({ assignedDate: -1 });

    const uniqueIssueMap = new Map();
    tasks.forEach((task) => {
      if (task.issueId?._id) {
        uniqueIssueMap.set(String(task.issueId._id), task.issueId);
      }
    });

    res.json(Array.from(uniqueIssueMap.values()));
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

    const taskIssue = await Issue.findById(task.issueId);
    if (!taskIssue) {
      return res.status(404).json({ message: "Issue not found for this task" });
    }

    // Keep grouped complaints in sync so all reporting users see consistent progress.
    const syncedIssues = await syncRelatedIssueStatuses({
      baseIssue: taskIssue,
      nextStatus: accepted ? "In Progress" : "Rejected",
      fromStatuses: accepted
        ? ["Reported", "Scheduled", "Pending"]
        : ["Reported", "Scheduled", "Pending", "In Progress"],
    });

    res.json({
      message: "Task response recorded",
      task: await updatedTask.populate(["issueId", "workerId"]),
      syncedIssues,
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

    const taskIssue = await Issue.findById(task.issueId);
    if (!taskIssue) {
      return res.status(404).json({ message: "Issue not found for this task" });
    }

    // Keep grouped complaints in sync so all reporting users see closure.
    const syncedIssues = await syncRelatedIssueStatuses({
      baseIssue: taskIssue,
      nextStatus: "Completed",
      fromStatuses: ["In Progress", "Scheduled", "Pending"],
    });

    res.json({
      message: "Task completed",
      task: await updatedTask.populate(["issueId", "workerId"]),
      syncedIssues,
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

    // Get all active workers first (matches autoScheduleIssues pattern)
    const allWorkers = await User.find({ role: "worker", isActive: true });

    const tasks = await Task.find({ weekNumber, year })
      .populate("workerId")
      .populate("issueId");

    // Initialize stats for ALL active workers
    const workerStats = {};
    allWorkers.forEach((worker) => {
      const workerId = worker._id.toString();
      workerStats[workerId] = {
        worker: worker,
        totalTasks: 0,
        completed: 0,
        inProgress: 0,
        scheduled: 0,
        rejected: 0,
        tasks: [],
      };
    });

    // Update stats for workers with tasks in this week
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

    // Get all active workers first (matches autoScheduleIssues pattern)
    const allWorkers = await User.find({ role: "worker", isActive: true });

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

    // Initialize breakdown for ALL active workers
    const workerBreakdown = {};
    allWorkers.forEach((worker) => {
      const workerId = worker._id.toString();
      workerBreakdown[workerId] = {
        workerName: worker.name || "Unknown Worker",
        workerCode: worker.workerId || "N/A",
        assigned: 0,
        completed: 0,
        inProgress: 0,
        scheduled: 0,
        rejected: 0,
      };
    });

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

// Admin: One-time cleanup for legacy duplicate active tasks in similar-location groups.
router.post("/cleanup-duplicate-active-tasks", authMiddleware, adminOnly, async (req, res) => {
  try {
    const activeTasks = await Task.find({
      status: { $in: ["Scheduled", "In Progress", "Pending"] },
    })
      .populate("issueId", "category location")
      .populate("workerId", "name");

    const groupedTasks = groupActiveTasksByArea(activeTasks);
    const duplicateTaskIds = [];
    const cleanupSummary = [];
    let issueStatusesSynced = 0;

    groupedTasks.forEach((group) => {
      if (group.tasks.length <= 1) {
        return;
      }

      const sortedTasks = [...group.tasks].sort(
        (a, b) => new Date(a.assignedDate || a.createdAt) - new Date(b.assignedDate || b.createdAt)
      );

      const keepTask = sortedTasks[0];
      const duplicateTasks = sortedTasks.slice(1);
      duplicateTasks.forEach((task) => duplicateTaskIds.push(task._id));

      cleanupSummary.push({
        category: group.category,
        location: group.representativeLocation,
        keptTaskId: keepTask._id,
        removedTaskIds: duplicateTasks.map((task) => task._id),
      });
    });

    if (duplicateTaskIds.length > 0) {
      await Task.updateMany(
        { _id: { $in: duplicateTaskIds } },
        {
          status: "Rejected",
          workerResponse: {
            accepted: false,
            feedback: "Duplicate task cleaned up automatically (same location group)",
            responseDate: new Date(),
          },
        }
      );
    }

    for (const summary of cleanupSummary) {
      const keepTask = activeTasks.find((task) => task._id.toString() === summary.keptTaskId.toString());
      if (!keepTask?.issueId) {
        continue;
      }

      const targetStatus = keepTask.status === "In Progress" ? "In Progress" : "Scheduled";
      issueStatusesSynced += await syncRelatedIssueStatuses({
        baseIssue: keepTask.issueId,
        nextStatus: targetStatus,
        fromStatuses: ["Reported", "Scheduled", "Pending", "In Progress"],
      });
    }

    return res.json({
      message:
        duplicateTaskIds.length > 0
          ? `Cleanup complete. ${duplicateTaskIds.length} duplicate active tasks were auto-rejected.`
          : "No duplicate active tasks found.",
      groupsChecked: groupedTasks.length,
      duplicateTasksRemoved: duplicateTaskIds.length,
      issueStatusesSynced,
      details: cleanupSummary,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// Admin: Auto-schedule unassigned issues to available workers
router.post("/auto-schedule", authMiddleware, adminOnly, async (req, res) => {
  console.log("[AUTO-SCHEDULE] Request received from user:", req.user?.id);
  try {
    const rawLimit = req.body?.limit;
    let parsedLimit;

    if (rawLimit !== undefined && rawLimit !== null && rawLimit !== "") {
      parsedLimit = Number(rawLimit);
      if (!Number.isInteger(parsedLimit) || parsedLimit <= 0) {
        return res.status(400).json({
          message: "limit must be a positive whole number",
        });
      }
    }

    const result = await autoScheduleIssues({ limit: parsedLimit });
    console.log("[AUTO-SCHEDULE] Result:", result);
    
    if (result.success) {
      return res.status(200).json({
        message: result.message,
        scheduledCount: result.scheduled,
        totalUnassigned: result.total,
        attemptedCount: result.attempted,
        requestedLimit: result.requestedLimit,
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
