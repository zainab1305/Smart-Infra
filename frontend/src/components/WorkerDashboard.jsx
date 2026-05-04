import { useState, useEffect } from "react";
import axios from "axios";
import "./Dashboard.css";
import ChatPanel from "./ChatPanel";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";

// Background images for dark and light themes (place files in public/ folder)
const BG_DARK = "/bg-dark.jpg";
const BG_LIGHT = "/bg-light.jpg";

export default function WorkerDashboard({ token, onLogout }) {
  const [theme, setTheme] = useState("dark");
  const [activeSection, setActiveSection] = useState("tasks");
  const [myTasks, setMyTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedTask, setSelectedTask] = useState(null);
  const [response, setResponse] = useState({ accepted: null, feedback: "" });
  const [taskSortBy, setTaskSortBy] = useState("newest");
  const [dismissedInProgressAlert, setDismissedInProgressAlert] = useState(false);

  useEffect(() => {
    fetchMyTasks();
    
    // Load theme from localStorage
    const savedTheme = localStorage.getItem("theme") || "dark";
    setTheme(savedTheme);
    document.documentElement.setAttribute("data-theme", savedTheme);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
  };

  const fetchMyTasks = async () => {
    setLoading(true);
    try {
      const res = await axios.get("http://localhost:5000/api/tasks/my-tasks", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMyTasks(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch tasks");
    } finally {
      setLoading(false);
    }
  };

  const handleRespondToTask = async (taskId) => {
    if (response.accepted === null) {
      setError("Please select Accept or Reject");
      return;
    }

    setLoading(true);
    try {
      await axios.put(
        `http://localhost:5000/api/tasks/${taskId}/respond`,
        response,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert("Response recorded successfully!");
      setSelectedTask(null);
      setResponse({ accepted: null, feedback: "" });
      fetchMyTasks();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to respond");
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteTask = async (taskId) => {
    setLoading(true);
    try {
      await axios.put(
        `http://localhost:5000/api/tasks/${taskId}/complete`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert("Task marked as completed!");
      setSelectedTask(null);
      setActiveSection("progress");
      setError("");
      setDismissedInProgressAlert(false);
      fetchMyTasks();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to complete task");
    } finally {
      setLoading(false);
    }
  };

  const scheduledTasks = myTasks.filter((t) => t.status === "Scheduled" || t.status === "Pending");
  const inProgressTasks = myTasks.filter((t) => t.status === "In Progress");
  const completedTasks = myTasks.filter((t) => t.status === "Completed");
  const rejectedTasks = myTasks.filter((t) => t.status === "Rejected");
  const totalAssigned = myTasks.length;
  const currentTasks = [...scheduledTasks, ...inProgressTasks];
  const historyTasks = [...completedTasks, ...rejectedTasks];

  const getReportedTimestamp = (task) => {
    const rawDate = task?.issueId?.createdAt || task?.createdAt || task?.updatedAt;
    const timestamp = new Date(rawDate).getTime();
    return Number.isNaN(timestamp) ? 0 : timestamp;
  };

  const getPriorityValue = (task) => {
    const score = Number(task?.issueId?.priorityScore ?? 0);
    return Number.isNaN(score) ? 0 : score;
  };

  const formatReportedDate = (task) => {
    const rawDate = task?.issueId?.createdAt || task?.createdAt || task?.updatedAt;
    if (!rawDate) return "N/A";
    return new Date(rawDate).toLocaleString();
  };

  const truncateLocation = (location = "", maxLength = 60) => {
    if (!location) return "Location unavailable";
    return location.length > maxLength ? `${location.slice(0, maxLength - 1)}...` : location;
  };

  const getPriorityTone = (task) => {
    const score = getPriorityValue(task);
    if (score >= 70) return "high";
    if (score >= 40) return "medium";
    return "low";
  };

  const sortDisplayTasks = (tasks) => {
    const sorted = [...tasks];

    sorted.sort((a, b) => {
      if (taskSortBy === "oldest") {
        return getReportedTimestamp(a) - getReportedTimestamp(b);
      }

      if (taskSortBy === "priorityHigh") {
        return getPriorityValue(b) - getPriorityValue(a);
      }

      if (taskSortBy === "priorityLow") {
        return getPriorityValue(a) - getPriorityValue(b);
      }

      return getReportedTimestamp(b) - getReportedTimestamp(a);
    });

    return sorted;
  };

  const sortedCurrentTasks = sortDisplayTasks(currentTasks);
  const sortedHistoryTasks = sortDisplayTasks(historyTasks);
  const inProgressOnlyAlert =
    /only.*(in-progress|in progress|scheduled).*(complete|completed|marked)/i.test(error);

  return (
    <div className="dashboard" style={{ backgroundImage: `url('${theme === "dark" ? BG_DARK : BG_LIGHT}')` }}>
      <button 
        className="theme-toggle-dashboard" 
        onClick={toggleTheme} 
        title="Toggle theme"
        aria-label="Toggle dark/light theme"
      >
        {theme === 'dark' ? '☀️' : '🌙'}
      </button>
      <nav className="dashboard-nav">
        <button
          className={`nav-btn ${activeSection === "tasks" ? "active" : ""}`}
          onClick={() => setActiveSection("tasks")}
        >
          📋 My Tasks
        </button>
        <button
          className={`nav-btn ${activeSection === "progress" ? "active" : ""}`}
          onClick={() => setActiveSection("progress")}
        >
          📊 Progress
        </button>
        <button
          className={`nav-btn ${activeSection === "chat" ? "active" : ""}`}
          onClick={() => setActiveSection("chat")}
        >
          💬 Chat
        </button>
        <div style={{ marginTop: "auto", padding: "20px 15px", borderTop: "1px solid rgba(59, 130, 246, 0.1)" }}>
          <button
            onClick={onLogout}
            className="logout-btn"
            style={{ width: "100%" }}
          >
            🚪 Logout
          </button>
        </div>
      </nav>

      <div className="dashboard-content">
        <div className="worker-page-container">
          {inProgressOnlyAlert && !dismissedInProgressAlert && (
            <div className="worker-inline-alert" role="alert">
              <span>Only tasks currently in progress can be marked complete.</span>
              <button
                type="button"
                className="worker-inline-alert-close"
                onClick={() => setDismissedInProgressAlert(true)}
                aria-label="Dismiss alert"
              >
                ✕
              </button>
            </div>
          )}
          {error && !inProgressOnlyAlert && <div className="error-message">{error}</div>}

        {activeSection === "tasks" && (
          <div className="section">
            <h2>Dashboard Overview</h2>

            <div className="worker-summary-strip worker-section-spacing">
              <div className="worker-summary-pill assigned">
                <span className="worker-summary-label">Assigned</span>
                <span className="worker-summary-value">{totalAssigned}</span>
              </div>
              <div className="worker-summary-pill scheduled">
                <span className="worker-summary-label">Scheduled</span>
                <span className="worker-summary-value">{scheduledTasks.length}</span>
              </div>
              <div className="worker-summary-pill in-progress">
                <span className="worker-summary-label">In Progress</span>
                <span className="worker-summary-value">{inProgressTasks.length}</span>
              </div>
              <div className="worker-summary-pill completed">
                <span className="worker-summary-label">Completed</span>
                <span className="worker-summary-value">{completedTasks.length}</span>
              </div>
              <div className="worker-summary-pill rejected">
                <span className="worker-summary-label">Rejected</span>
                <span className="worker-summary-value">{rejectedTasks.length}</span>
              </div>
            </div>

            <div className="worker-section-spacing">
              <h3>Progress</h3>
              <div className="charts-container">
                <div className="chart-box completion-chart-box">
                  <h3>Completion Rate Chart</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={[
                          {
                            name: "Completed",
                            value: myTasks.length > 0 ? Math.round((completedTasks.length / myTasks.length) * 100) : 0,
                          },
                          {
                            name: "Remaining",
                            value: myTasks.length > 0 ? 100 - Math.round((completedTasks.length / myTasks.length) * 100) : 100,
                          },
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        fill="#8884d8"
                        paddingAngle={2}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}%`}
                      >
                        <Cell fill="#22c55e" />
                        <Cell fill="rgba(59, 130, 246, 0.3)" />
                      </Pie>
                      <Tooltip formatter={(value) => `${value}%`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="chart-box tasks-chart-box">
                  <h3>Task Distribution Chart</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={[
                        {
                          name: "Completed",
                          value: completedTasks.length,
                          fill: "#22c55e",
                        },
                        {
                          name: "In Progress",
                          value: inProgressTasks.length,
                          fill: "#f59e0b",
                        },
                        {
                          name: "Scheduled",
                          value: scheduledTasks.length,
                          fill: "#3b82f6",
                        },
                        {
                          name: "Rejected",
                          value: rejectedTasks.length,
                          fill: "#ef4444",
                        },
                      ]}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.2)" />
                      <XAxis dataKey="name" stroke="#cbd5e1" style={{ fontSize: "0.75rem" }} />
                      <YAxis stroke="#cbd5e1" style={{ fontSize: "0.75rem" }} />
                      <Tooltip
                        cursor={{ fill: "rgba(59, 130, 246, 0.1)" }}
                        contentStyle={{
                          backgroundColor: "rgba(15, 23, 42, 0.95)",
                          border: "1px solid rgba(59, 130, 246, 0.3)",
                          borderRadius: "6px",
                          color: "#e2e8f0",
                        }}
                      />
                      <Bar dataKey="value" fill="#8884d8" radius={6}>
                        <Cell fill="#22c55e" />
                        <Cell fill="#f59e0b" />
                        <Cell fill="#3b82f6" />
                        <Cell fill="#ef4444" />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSection === "progress" && (
          <div className="section">
            <h2>Tasks</h2>

            {selectedTask ? (
              <div className="task-detail">
                <button onClick={() => setSelectedTask(null)} className="back-btn">
                  ← Back
                </button>
                <h3>Task Details</h3>
                <p><strong>Category:</strong> {selectedTask.issueId?.category}</p>
                <p><strong>Location:</strong> {selectedTask.issueId?.location}</p>
                <p><strong>Priority:</strong> {selectedTask.issueId?.priorityScore}</p>
                <p><strong>Status:</strong> {selectedTask.status}</p>
                <p><strong>Due Date:</strong> {selectedTask.dueDate ? new Date(selectedTask.dueDate).toLocaleDateString() : "Not set"}</p>

                {(selectedTask.status === "Scheduled" || selectedTask.status === "Pending") && (
                  <div className="response-form">
                    <h4>What would you like to do?</h4>
                    <div className="button-group">
                      <button
                        className={`accept-btn ${response.accepted === true ? "selected" : ""}`}
                        onClick={() => setResponse({ ...response, accepted: true })}
                      >
                        ✓ Accept Task
                      </button>
                      <button
                        className={`reject-btn ${response.accepted === false ? "selected" : ""}`}
                        onClick={() => setResponse({ ...response, accepted: false })}
                      >
                        ✗ Reject Task
                      </button>
                    </div>
                    {response.accepted !== null && (
                      <textarea
                        placeholder="Add feedback (optional)"
                        value={response.feedback}
                        onChange={(e) => setResponse({ ...response, feedback: e.target.value })}
                      />
                    )}
                    <button
                      onClick={() => handleRespondToTask(selectedTask._id)}
                      disabled={loading}
                      className="submit-btn"
                    >
                      {loading ? "Submitting..." : "Submit Response"}
                    </button>
                  </div>
                )}

                {selectedTask.status === "In Progress" && (
                  <button
                    onClick={() => handleCompleteTask(selectedTask._id)}
                    disabled={loading}
                    className="complete-btn"
                  >
                    {loading ? "Marking..." : "Mark as Completed"}
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className="worker-sort-row worker-section-spacing">
                  <label htmlFor="worker-task-sort">Sort By:</label>
                  <select
                    id="worker-task-sort"
                    value={taskSortBy}
                    onChange={(e) => setTaskSortBy(e.target.value)}
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="priorityHigh">Priority High - Low</option>
                    <option value="priorityLow">Priority Low - High</option>
                  </select>
                </div>

                <div className="worker-task-columns worker-section-spacing">
                  <div className="task-section worker-task-column-card">
                    <h3>Active Tasks</h3>
                    <p className="worker-section-subtitle">
                      Scheduled and In Progress tasks requiring action
                    </p>
                    {sortedCurrentTasks.length === 0 && <p className="worker-empty-text">No active tasks</p>}
                    {sortedCurrentTasks.map((task) => (
                      <div key={task._id} className="task-card worker-task-card">
                        <h4>{task.issueId?.category || "Untitled Task"}</h4>
                        <p className="worker-task-location">{truncateLocation(task.issueId?.location)}</p>
                        <div className="worker-task-meta">
                          <span className={`priority-badge ${getPriorityTone(task)}`}>
                            Priority {getPriorityValue(task)}
                          </span>
                          <span className={`status-badge status-${task.status.replace(/\s+/g, '')}`}>
                            {task.status === "Pending" ? "Scheduled" : task.status}
                          </span>
                        </div>
                        <p className="worker-task-reported">Reported: {formatReportedDate(task)}</p>
                        <button onClick={() => setSelectedTask(task)} className="view-btn">
                          View Details
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="task-section worker-task-column-card">
                  <h3>Task History</h3>
                  <p className="worker-section-subtitle">
                    Completed and Rejected tasks
                  </p>
                  {sortedHistoryTasks.length === 0 && <p className="worker-empty-text">No task history yet</p>}
                  {sortedHistoryTasks.map((task) => (
                    <div key={task._id} className="task-card worker-task-card">
                      <h4>{task.issueId?.category || "Untitled Task"}</h4>
                      <p className="worker-task-location">{truncateLocation(task.issueId?.location)}</p>
                      <div className="worker-task-meta">
                        <span className={`priority-badge ${getPriorityTone(task)}`}>
                          Priority {getPriorityValue(task)}
                        </span>
                        <span className={`status-badge status-${task.status.replace(/\s+/g, '')}`}>
                          {task.status}
                        </span>
                      </div>
                      <p className="worker-task-reported">Reported: {formatReportedDate(task)}</p>
                      <button onClick={() => setSelectedTask(task)} className="view-btn">
                        View Details
                      </button>
                    </div>
                  ))}
                </div>
                </div>
              </>
            )}
          </div>
        )}

        {activeSection === "chat" && (
          <div className="section">
            <h2>Worker and Admin Chat</h2>
            <ChatPanel
              token={token}
              issueOptions={myTasks.map((task) => task.issueId).filter(Boolean)}
            />
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
