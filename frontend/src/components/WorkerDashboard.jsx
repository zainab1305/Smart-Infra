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
        {error && <div className="error-message">{error}</div>}

        {activeSection === "tasks" && (
          <div className="section">
            <h2>My Assigned Tasks</h2>

            <div className="worker-summary-grid">
              <div className="stat-card">
                <h3>Assigned</h3>
                <p className="stat-number">{totalAssigned}</p>
              </div>
              <div className="stat-card">
                <h3>Scheduled</h3>
                <p className="stat-number">{scheduledTasks.length}</p>
              </div>
              <div className="stat-card">
                <h3>In Progress</h3>
                <p className="stat-number">{inProgressTasks.length}</p>
              </div>
              <div className="stat-card">
                <h3>Completed</h3>
                <p className="stat-number">{completedTasks.length}</p>
              </div>
              <div className="stat-card">
                <h3>Rejected</h3>
                <p className="stat-number">{rejectedTasks.length}</p>
              </div>
            </div>

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
              <div className="worker-task-columns">
                <div className="task-section">
                  <h3>Current Tasks</h3>
                  <p className="worker-section-subtitle">
                    Scheduled and In Progress tasks requiring action
                  </p>
                  {currentTasks.length === 0 && <p className="worker-empty-text">No current tasks</p>}
                  {scheduledTasks.map((task) => (
                    <div key={task._id} className="task-card worker-task-card">
                      <h4>{task.issueId?.category}</h4>
                      <p>{task.issueId?.location}</p>
                      <p>Priority: {task.issueId?.priorityScore}</p>
                      <p>Status: <span className="status-badge status-Scheduled">Scheduled</span></p>
                      <button onClick={() => setSelectedTask(task)} className="view-btn">
                        View Details
                      </button>
                    </div>
                  ))}
                  {inProgressTasks.map((task) => (
                    <div key={task._id} className="task-card worker-task-card">
                      <h4>{task.issueId?.category}</h4>
                      <p>{task.issueId?.location}</p>
                      <p>Priority: {task.issueId?.priorityScore}</p>
                      <p>Status: <span className={`status-badge status-${task.status.replace(/\s+/g, '')}`}>{task.status}</span></p>
                      <button onClick={() => setSelectedTask(task)} className="view-btn">
                        View Details
                      </button>
                    </div>
                  ))}
                </div>

                <div className="task-section">
                  <h3>Task History</h3>
                  <p className="worker-section-subtitle">
                    Completed and Rejected tasks
                  </p>
                  {historyTasks.length === 0 && <p className="worker-empty-text">No task history yet</p>}
                  {completedTasks.map((task) => (
                    <div key={task._id} className="task-card worker-task-card completed">
                      <h4>{task.issueId?.category}</h4>
                      <p>{task.issueId?.location}</p>
                      <p>Status: <span className={`status-badge status-${task.status.replace(/\s+/g, '')}`}>{task.status}</span></p>
                      <p>Completed on: {new Date(task.updatedAt).toLocaleDateString()}</p>
                    </div>
                  ))}
                  {rejectedTasks.map((task) => (
                    <div key={task._id} className="task-card worker-task-card">
                      <h4>{task.issueId?.category}</h4>
                      <p>{task.issueId?.location}</p>
                      <p>Status: <span className="status-badge status-Rejected">Rejected</span></p>
                      <p>Updated on: {new Date(task.updatedAt).toLocaleDateString()}</p>
                      {task.workerResponse?.feedback && <p>Feedback: {task.workerResponse.feedback}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeSection === "progress" && (
          <div className="section">
            <h2>Your Weekly Progress</h2>
            
            <div className="charts-container">
              {/* Completion Rate Pie Chart */}
              <div className="chart-box completion-chart-box">
                <h3>Completion Rate</h3>
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

              {/* Task Status Chart */}
              <div className="chart-box tasks-chart-box">
                <h3>Task Distribution</h3>
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
                        fill: "#fbbf24",
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
                      <Cell fill="#fbbf24" />
                      <Cell fill="#3b82f6" />
                      <Cell fill="#ef4444" />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
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
  );
}
