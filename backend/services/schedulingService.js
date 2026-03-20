const Issue = require("../models/Issue");
const Task = require("../models/Task");
const User = require("../models/User");

// Get current week number
const getCurrentWeek = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const diff = now - start;
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay / 7) + 1;
};

/**
 * Auto-schedule unassigned issues to available workers
 * 
 * Process:
 * 1. Collect all unassigned issues (status = "Reported")
 * 2. Sort them by priority score (highest first)
 * 3. Get all available workers (role = "worker", isActive = true)
 * 4. Distribute tasks using round-robin to balance workload
 * 
 * @returns {Object} Scheduling result with statistics
 */
const autoScheduleIssues = async () => {
  try {
    console.log("[Scheduler] Starting auto-schedule process...");
    
    // Step 1: Get all unassigned issues (status = "Reported" or issues without tasks assigned)
    console.log("[Scheduler] Fetching unassigned issues...");
    
    // First, get all issues with "Reported" status
    const reportedIssues = await Issue.find({
      status: "Reported"
    }).sort({
      priorityScore: -1,
      createdAt: 1
    });
    
    console.log(`[Scheduler] Found ${reportedIssues.length} issues with 'Reported' status`);

    if (reportedIssues.length === 0) {
      console.log("[Scheduler] No unassigned issues found");
      return {
        success: true,
        message: "No unassigned issues found",
        scheduled: 0,
        total: 0,
        workers: 0
      };
    }

    const unassignedIssues = reportedIssues;
    console.log(`[Scheduler] Total unassigned issues: ${unassignedIssues.length}`);

    // Step 2: Get all available workers
    console.log("[Scheduler] Fetching available workers...");
    const availableWorkers = await User.find({
      role: "worker",
      isActive: true
    });

    console.log(`[Scheduler] Found ${availableWorkers.length} available workers`);
    
    if (availableWorkers.length === 0) {
      console.warn("[Scheduler] No available workers found!");
      return {
        success: false,
        message: "No available workers found. Please create and activate workers first.",
        scheduled: 0,
        total: unassignedIssues.length,
        workers: 0
      };
    }

    // Step 3: Count current tasks assigned to each worker for load balancing
    console.log("[Scheduler] Counting existing tasks...");
    const workerTaskCounts = {};
    availableWorkers.forEach(worker => {
      workerTaskCounts[worker._id.toString()] = 0;
    });

    // Get task counts for all workers
    const taskCounts = await Task.aggregate([
      {
        $match: {
          workerId: { $in: availableWorkers.map(w => w._id) },
          status: { $in: ["Scheduled", "In Progress", "Pending"] }
        }
      },
      {
        $group: {
          _id: "$workerId",
          count: { $sum: 1 }
        }
      }
    ]);

    // Populate task counts
    taskCounts.forEach(entry => {
      workerTaskCounts[entry._id.toString()] = entry.count;
    });

    console.log("[Scheduler] Worker task counts:", workerTaskCounts);

    // Step 4: Distribute tasks using round-robin with load balancing
    console.log("[Scheduler] Starting task distribution...");
    const weekNumber = getCurrentWeek();
    const year = new Date().getFullYear();
    const scheduledTasks = [];
    const scheduledIssueIds = [];

    for (const issue of unassignedIssues) {
      // Find worker with minimum tasks (load balancing)
      let selectedWorker = availableWorkers[0];
      let minTasks = workerTaskCounts[selectedWorker._id.toString()];

      for (let i = 1; i < availableWorkers.length; i++) {
        const currentWorker = availableWorkers[i];
        const currentTaskCount = workerTaskCounts[currentWorker._id.toString()];
        
        if (currentTaskCount < minTasks) {
          selectedWorker = currentWorker;
          minTasks = currentTaskCount;
        }
      }

      console.log(`[Scheduler] Assigning issue ${issue._id} (${issue.category}) to worker ${selectedWorker.name}`);

      // Create and save task
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 7); // Set due date 7 days from now

      const task = new Task({
        issueId: issue._id,
        workerId: selectedWorker._id,
        assignedDate: new Date(),
        dueDate,
        status: "Scheduled",
        weekNumber,
        year
      });

      await task.save();
      console.log(`[Scheduler] Task created: ${task._id}`);
      
      // Update issue status to "Scheduled"
      await Issue.findByIdAndUpdate(issue._id, { status: "Scheduled" });
      console.log(`[Scheduler] Issue status updated to Scheduled`);

      // Increment worker task count for next assignment
      workerTaskCounts[selectedWorker._id.toString()]++;

      scheduledTasks.push({
        taskId: task._id,
        issueId: issue._id,
        workerId: selectedWorker._id,
        workerName: selectedWorker.name,
        category: issue.category,
        location: issue.location,
        priorityScore: issue.priorityScore
      });

      scheduledIssueIds.push(issue._id);
    }

    console.log(`[Scheduler] Successfully scheduled ${scheduledTasks.length} tasks`);
    return {
      success: true,
      message: `Successfully scheduled ${scheduledTasks.length} issues`,
      scheduled: scheduledTasks.length,
      total: unassignedIssues.length,
      workers: availableWorkers.length,
      details: scheduledTasks
    };
  } catch (error) {
    console.error("[Scheduler] CRITICAL ERROR in auto-scheduling:", error);
    console.error("[Scheduler] Error name:", error.name);
    console.error("[Scheduler] Error message:", error.message);
    console.error("[Scheduler] Stack trace:", error.stack);
    return {
      success: false,
      message: error.message || "Unknown error occurred",
      scheduled: 0,
      error: error.toString()
    };
  }
};

module.exports = { autoScheduleIssues };
