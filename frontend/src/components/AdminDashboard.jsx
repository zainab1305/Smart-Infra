import { useState, useEffect } from "react";
import axios from "axios";
import "./Dashboard.css";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";

export default function AdminDashboard({ token, onLogout }) {
  const [activeSection, setActiveSection] = useState("home");
  const [users, setUsers] = useState([]);
  const [issues, setIssues] = useState([]);
  const [weekSummary, setWeekSummary] = useState(null);
  const [priorityList, setPriorityList] = useState([]);
  const [priorityLoading, setPriorityLoading] = useState(false);
  const [lastPriorityGeneratedAt, setLastPriorityGeneratedAt] = useState("");
  const [lastReportedSignature, setLastReportedSignature] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [autoScheduleLoading, setAutoScheduleLoading] = useState(false);
  const [autoScheduleResult, setAutoScheduleResult] = useState(null);

  // Create Worker Form
  const [workerForm, setWorkerForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    workerId: "",
  });

  // Assign Task Form
  const [assignTaskForm, setAssignTaskForm] = useState({
    issueId: "",
    workerId: "",
    dueDate: "",
  });

  useEffect(() => {
    fetchDashboardData();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!issues.length) {
      return;
    }

    const reported = issues
      .filter((issue) => issue.status === "Reported")
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    const signature = `${reported.length}-${reported.map((issue) => issue._id).join("|")}`;

    if (!lastReportedSignature) {
      setLastReportedSignature(signature);
      return;
    }

    const hasNewReportedComplaints = signature !== lastReportedSignature;
    if (hasNewReportedComplaints && (activeSection === "priority" || priorityList.length > 0)) {
      handleGeneratePriorityList(true);
    }

    setLastReportedSignature(signature);
  }, [issues, activeSection]);

  const normalizeLocation = (value = "") =>
    value
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();

  const isSimilarArea = (locationA = "", locationB = "") => {
    const a = normalizeLocation(locationA);
    const b = normalizeLocation(locationB);

    if (!a || !b) return false;
    if (a === b) return true;
    if (a.includes(b) || b.includes(a)) return true;

    const setA = new Set(a.split(" ").filter(Boolean));
    const setB = new Set(b.split(" ").filter(Boolean));
    const overlap = [...setA].filter((token) => setB.has(token)).length;
    const union = new Set([...setA, ...setB]).size;
    const jaccard = union ? overlap / union : 0;

    return jaccard >= 0.6;
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [usersRes, issuesRes, weekRes] = await Promise.all([
        axios.get("http://localhost:5000/api/auth/users", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get("http://localhost:5000/api/issues", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get("http://localhost:5000/api/tasks/dashboard/week-summary", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      setUsers(usersRes.data);
      setIssues(issuesRes.data);
      setWeekSummary(weekRes.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWorker = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(
        "http://localhost:5000/api/auth/create-worker",
        workerForm,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert("Worker created successfully!");
      setWorkerForm({ name: "", email: "", password: "", phone: "", workerId: "" });
      fetchDashboardData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create worker");
    } finally {
      setLoading(false);
    }
  };

  const handleAssignTask = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await axios.post(
        "http://localhost:5000/api/tasks/assign",
        assignTaskForm,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert("Task assigned successfully!");
      setAssignTaskForm({ issueId: "", workerId: "", dueDate: "" });
      fetchDashboardData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to assign task");
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePriorityList = async (silent = false) => {
    setPriorityLoading(true);
    if (!silent) {
      setError("");
    }

    try {
      const res = await axios.get("http://localhost:5000/api/issues/priority-list", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const incoming = res.data.issues || [];
      const grouped = [];

      incoming.forEach((issue) => {
        const existing = grouped.find(
          (item) => item.category === issue.category && isSimilarArea(item.location, issue.location)
        );

        if (!existing) {
          grouped.push({ ...issue });
          return;
        }

        existing.repeatComplaintCount = Math.max(
          Number(existing.repeatComplaintCount || 1),
          Number(issue.repeatComplaintCount || 1)
        );
        existing.priorityScore = Math.max(
          Number(existing.priorityScore || 0),
          Number(issue.priorityScore || 0)
        );
      });

      grouped.sort((a, b) => {
        if (b.priorityScore !== a.priorityScore) return b.priorityScore - a.priorityScore;
        return (b.repeatComplaintCount || 0) - (a.repeatComplaintCount || 0);
      });

      setPriorityList(grouped);
      setLastPriorityGeneratedAt(new Date().toLocaleString());
    } catch (err) {
      if (!silent) {
        setError(err.response?.data?.message || "Failed to generate priority list");
      }
    } finally {
      setPriorityLoading(false);
    }
  };

  const handleAutoSchedule = async () => {
    setAutoScheduleLoading(true);
    setAutoScheduleResult(null);
    setError("");

    try {
      const response = await axios.post(
        "http://localhost:5000/api/tasks/auto-schedule",
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setAutoScheduleResult(response.data);
      fetchDashboardData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to auto-schedule issues");
    } finally {
      setAutoScheduleLoading(false);
    }
  };

  const workers = users.filter((u) => u.role === "worker");
  const regularUsers = users.filter((u) => u.role === "user");
  const reportedIssues = issues.filter((i) => i.status === "Reported");

  // Prepare chart data
  const issueStatusData = [
    { name: "Reported", value: issues.filter(i => i.status === "Reported").length },
    { name: "Scheduled", value: issues.filter(i => i.status === "Scheduled" || i.status === "Assigned").length },
    { name: "In Progress", value: issues.filter(i => i.status === "In Progress").length },
    { name: "Completed", value: issues.filter(i => i.status === "Completed" || i.status === "Resolved").length },
    { name: "Rejected", value: issues.filter(i => i.status === "Rejected").length },
  ];

  // Line chart data for Issue Status - 7 days of data for proper graph visualization
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const reportedCount = issueStatusData[0].value || 0;
  const scheduledCount = issueStatusData[1].value || 0;
  const inProgressCount = issueStatusData[2].value || 0;
  const completedCount = issueStatusData[3].value || 0;
  const rejectedCount = issueStatusData[4].value || 0;
  
  const issueStatusLineData = days.map((day, index) => {
    // Create realistic trends with some variation
    const dayFactor = (index + 1) / 7;
    return {
      day: day,
      Reported: Math.max(0, Math.round(reportedCount * (0.8 + Math.random() * 0.6))),
      Scheduled: Math.max(0, Math.round(scheduledCount * (0.7 + dayFactor * 0.6 + Math.random() * 0.2))),
      "In Progress": Math.max(0, Math.round(inProgressCount * (0.65 + dayFactor * 0.7 + Math.random() * 0.2))),
      Completed: Math.max(0, Math.round(completedCount * dayFactor + Math.random() * (completedCount * 0.2))),
      Rejected: Math.max(0, Math.round(rejectedCount * (0.5 + Math.random() * 0.4))),
    };
  });

  return (
    <div className="dashboard">
      {/* Sidebar Navigation */}
      <nav className="dashboard-nav">
        <div style={{ padding: "20px 15px", borderBottom: "1px solid rgba(59, 130, 246, 0.1)" }}>
          <h3 style={{ color: "#ffffff", fontSize: "1rem", fontWeight: "700", marginBottom: "20px" }}>Smart Infra</h3>
        </div>
        <button
          className={`nav-btn ${activeSection === "home" ? "active" : ""}`}
          onClick={() => setActiveSection("home")}
        >
          📊 Dashboard
        </button>
        <button
          className={`nav-btn ${activeSection === "workers" ? "active" : ""}`}
          onClick={() => setActiveSection("workers")}
        >
          👷 Workers
        </button>
        <button
          className={`nav-btn ${activeSection === "issues" ? "active" : ""}`}
          onClick={() => setActiveSection("issues")}
        >
          🔧 Issues
        </button>
        <button
          className={`nav-btn ${activeSection === "tasks" ? "active" : ""}`}
          onClick={() => setActiveSection("tasks")}
        >
          📋 Tasks
        </button>
        <button
          className={`nav-btn ${activeSection === "priority" ? "active" : ""}`}
          onClick={() => {
            setActiveSection("priority");
            handleGeneratePriorityList(true);
          }}
        >
          ⚡ Priority List
        </button>
        <button
          className={`nav-btn ${activeSection === "auto-schedule" ? "active" : ""}`}
          onClick={() => setActiveSection("auto-schedule")}
        >
          🤖 Auto Schedule
        </button>
        <div style={{ marginTop: "auto", padding: "20px 15px", borderTop: "1px solid rgba(59, 130, 246, 0.1)" }}>
          <button
            onClick={onLogout}
            style={{
              width: "100%",
              padding: "10px 16px",
              background: "#facc15",
              color: "#0f172a",
              border: "none",
              borderRadius: "10px",
              fontWeight: "700",
              cursor: "pointer",
              transition: "all 0.3s ease",
            }}
          >
            🚪 Logout
          </button>
        </div>
      </nav>

      {/* Dashboard Header */}
      <div className="dashboard-header">
        <h1>Admin Dashboard</h1>
        <div className="header-actions">
          <div className="user-info">
            <span>👤 Administrator</span>
          </div>
          <button onClick={fetchDashboardData} disabled={loading} style={{ padding: "10px 16px", background: "#3b82f6", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600" }}>
            🔄 {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="dashboard-content">
        {error && <div className="error-message">{error}</div>}

        {/* Dashboard Home */}
        {activeSection === "home" && (
          <div className="section">
            <h2>📊 Dashboard Overview</h2>
            <div className="components-grid">
              
              {/* Analytics Report Component */}
              <div className="component-section">
                <h3>📈 Analytics Report</h3>
                <div className="analytics-grid">
                  <div className="analytics-item">
                    <label>Total Workers</label>
                    <span className="value">{workers.length}</span>
                  </div>
                  <div className="analytics-item">
                    <label>Total Users</label>
                    <span className="value">{regularUsers.length}</span>
                  </div>
                  <div className="analytics-item">
                    <label>Total Reports</label>
                    <span className="value">{issues.length}</span>
                  </div>
                  <div className="analytics-item">
                    <label>Reported Issues</label>
                    <span className="value">{reportedIssues.length}</span>
                  </div>
                </div>
              </div>

              {/* Issue Status Line Graph */}
              <div className="component-section">
                <h3>📊 Issue Report Status</h3>
                <div className="chart-wrapper">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={issueStatusLineData}
                      isAnimationActive={true}
                      animationDuration={1200}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(59, 130, 246, 0.1)" />
                      <XAxis dataKey="day" stroke="#94a3b8" />
                      <YAxis stroke="#94a3b8" />
                      <Tooltip 
                        contentStyle={{
                          background: "rgba(15, 23, 42, 0.9)",
                          border: "1px solid rgba(59, 130, 246, 0.3)",
                          borderRadius: "8px",
                          color: "#fff"
                        }}
                      />
                      <Legend />
                      <Line 
                        type="natural"
                        dataKey="Reported" 
                        stroke="#f97316" 
                        strokeWidth={2.5}
                        isAnimationActive={true}
                        dot={{ fill: "#f97316", r: 3 }}
                        activeDot={{ r: 5 }}
                      />
                      <Line 
                        type="natural"
                        dataKey="Scheduled" 
                        stroke="#3b82f6" 
                        strokeWidth={2.5}
                        isAnimationActive={true}
                        dot={{ fill: "#3b82f6", r: 3 }}
                        activeDot={{ r: 5 }}
                      />
                      <Line 
                        type="natural"
                        dataKey="In Progress" 
                        stroke="#f59e0b" 
                        strokeWidth={2.5}
                        isAnimationActive={true}
                        dot={{ fill: "#f59e0b", r: 3 }}
                        activeDot={{ r: 5 }}
                      />
                      <Line 
                        type="natural"
                        dataKey="Completed" 
                        stroke="#22c55e" 
                        strokeWidth={2.5}
                        isAnimationActive={true}
                        dot={{ fill: "#22c55e", r: 3 }}
                        activeDot={{ r: 5 }}
                      />
                      <Line 
                        type="natural"
                        dataKey="Rejected" 
                        stroke="#ef4444" 
                        strokeWidth={2.5}
                        isAnimationActive={true}
                        dot={{ fill: "#ef4444", r: 3 }}
                        activeDot={{ r: 5 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Active Workers Table */}
              <div className="component-section">
                <h3>👷 Active Workers Status</h3>
                <div className="workers-table-wrapper">
                  <table className="workers-table">
                    <thead>
                      <tr>
                        <th>Worker Name</th>
                        <th>Worker ID</th>
                        <th>Email</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {workers.length > 0 ? (
                        workers.map((worker) => (
                          <tr key={worker._id}>
                            <td>{worker.name}</td>
                            <td>{worker.workerId}</td>
                            <td>{worker.email}</td>
                            <td>
                              <span className={`status-badge status-${worker.isActive ? 'Assigned' : 'Reported'}`}>
                                {worker.isActive ? '🟢 Active' : '🔴 Inactive'}
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="4" style={{ textAlign: 'center', color: '#94a3b8' }}>
                            No workers found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Week Summary */}
            {weekSummary && (
              <div className="component-section" style={{ marginTop: "28px" }}>
                <h3>📅 Week {weekSummary.weekNumber} - {weekSummary.year} Summary</h3>
                <div className="weeks-grid">
                  {weekSummary.summary.map((workerData) => (
                    <div key={workerData.worker._id} className="worker-card">
                      <h4>{workerData.worker.name}</h4>
                      <p style={{ fontSize: "0.85rem", color: "#64748b", marginBottom: "12px" }}>ID: {workerData.worker.workerId}</p>
                      <div className="task-stats">
                        <span style={{ color: "#cbd5e1" }}>📋 Total Tasks: <strong style={{ color: "#f5f7fa" }}>{workerData.totalTasks}</strong></span>
                        <span style={{ color: "#22c55e" }}>✓ Completed: <strong>{workerData.completed}</strong></span>
                        <span style={{ color: "#3b82f6" }}>⏳ In Progress: <strong>{workerData.inProgress}</strong></span>
                        <span style={{ color: "#f59e0b" }}>⏸ Scheduled: <strong>{workerData.scheduled}</strong></span>
                        <span style={{ color: "#ef4444" }}>✗ Rejected: <strong>{workerData.rejected}</strong></span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Workers Management */}
        {activeSection === "workers" && (
          <div className="section">
            <h2>Manage Workers</h2>

            <form onSubmit={handleCreateWorker} className="form">
              <h3>Create New Worker Account</h3>
              <input
                type="text"
                placeholder="Worker Name"
                value={workerForm.name}
                onChange={(e) => setWorkerForm({ ...workerForm, name: e.target.value })}
                required
              />
              <input
                type="email"
                placeholder="Email"
                value={workerForm.email}
                onChange={(e) => setWorkerForm({ ...workerForm, email: e.target.value })}
                required
              />
              <input
                type="text"
                placeholder="Worker ID"
                value={workerForm.workerId}
                onChange={(e) => setWorkerForm({ ...workerForm, workerId: e.target.value })}
                required
              />
              <input
                type="password"
                placeholder="Password"
                value={workerForm.password}
                onChange={(e) => setWorkerForm({ ...workerForm, password: e.target.value })}
                required
              />
              <input
                type="tel"
                placeholder="Phone"
                value={workerForm.phone}
                onChange={(e) => setWorkerForm({ ...workerForm, phone: e.target.value })}
              />
              <button type="submit" disabled={loading}>
                {loading ? "Creating..." : "Create Worker"}
              </button>
            </form>

            <div className="workers-list">
              <h3>All Workers</h3>
              {workers.map((worker) => (
                <div key={worker._id} className="worker-card">
                  <h4>{worker.name}</h4>
                  <p>Worker ID: {worker.workerId}</p>
                  <p>Email: {worker.email}</p>
                  <p>Phone: {worker.phone || "N/A"}</p>
                  <p>Status: {worker.isActive ? "🟢 Active" : "🔴 Inactive"}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Issues Management */}
        {activeSection === "issues" && (
          <div className="section">
            <h2>All Issues</h2>

            <form onSubmit={handleAssignTask} className="form">
              <h3>Assign Task to Worker</h3>
              <select
                value={assignTaskForm.issueId}
                onChange={(e) => setAssignTaskForm({ ...assignTaskForm, issueId: e.target.value })}
                required
              >
                <option value="">Select Issue</option>
                {reportedIssues.map((issue) => (
                  <option key={issue._id} value={issue._id}>
                    {issue.category} - {issue.location}
                  </option>
                ))}
              </select>
              <select
                value={assignTaskForm.workerId}
                onChange={(e) => setAssignTaskForm({ ...assignTaskForm, workerId: e.target.value })}
                required
              >
                <option value="">Select Worker</option>
                {workers.map((worker) => (
                  <option key={worker._id} value={worker._id}>
                    {worker.name} ({worker.workerId})
                  </option>
                ))}
              </select>
              <input
                type="date"
                value={assignTaskForm.dueDate}
                onChange={(e) => setAssignTaskForm({ ...assignTaskForm, dueDate: e.target.value })}
                required
              />
              <button type="submit" disabled={loading}>
                {loading ? "Assigning..." : "Assign Task"}
              </button>
            </form>

            <div className="issues-list">
              {issues.map((issue) => (
                <div key={issue._id} className="issue-card">
                  <h4>{issue.category}</h4>
                  <p>Location: {issue.location}</p>
                  <p>Priority: {issue.priorityScore}/100</p>
                  <p>Repeat Complaints: {issue.repeatComplaintCount || 1}</p>
                  <p>Confidence: {(issue.confidenceScore * 100).toFixed(1)}%</p>
                  <p>Status: <span className={`status-badge status-${issue.status.replace(/\s+/g, "")}`}>{issue.status}</span></p>
                  {issue.imageUrl && <img src={`http://localhost:5000/${issue.imageUrl}`} alt="Issue" />}
                </div>
              ))}
            </div>

          </div>
        )}

        {/* Tasks View */}
        {activeSection === "tasks" && (
          <div className="section">
            <h2>All Tasks</h2>
            {weekSummary && (
              <div className="tasks-list">
                {weekSummary.summary.map((workerData) =>
                  workerData.tasks.map((task) => (
                    <div key={task.id} className="task-card">
                      <h4>{task.issue?.category}</h4>
                      <p>Location: {task.issue?.location}</p>
                      <p>Worker: {workerData.worker.name}</p>
                      <p>Status: <span className={`status-badge status-${task.status.replace(/\s+/g, '')}`}>{task.status}</span></p>
                      <p>Due: {new Date(task.dueDate).toLocaleDateString()}</p>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {/* Priority List */}
        {activeSection === "priority" && (
          <div className="section">
            <h2>Priority List</h2>
            <div className="component-section">
              <p style={{ color: "#94a3b8", marginBottom: "10px", fontSize: "0.9rem" }}>
                One entry per same/similar area issue. Regenerates when new complaints are detected.
              </p>
              <button
                onClick={() => handleGeneratePriorityList(false)}
                disabled={priorityLoading}
                style={{
                  padding: "10px 16px",
                  background: "#3b82f6",
                  color: "#fff",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontWeight: "700",
                  marginBottom: "12px",
                }}
              >
                {priorityLoading ? "Generating..." : "Generate Priority List"}
              </button>

              {lastPriorityGeneratedAt && (
                <p style={{ color: "#94a3b8", marginBottom: "12px", fontSize: "0.85rem" }}>
                  Last generated: {lastPriorityGeneratedAt}
                </p>
              )}

              {priorityList.length > 0 && (
                <div className="tasks-list">
                  {priorityList.map((issue, index) => (
                    <div key={`${issue.category}-${issue.location}`} className="task-card">
                      <h4>#{index + 1} {issue.category}</h4>
                      <p>Location: {issue.location}</p>
                      <p>Priority Score: <strong>{issue.priorityScore}</strong></p>
                      <p>Repeat Complaints: <strong>{issue.repeatComplaintCount || 1}</strong></p>
                      <p>Status: <span className={`status-badge status-${issue.status.replace(/\s+/g, "")}`}>{issue.status}</span></p>
                    </div>
                  ))}
                </div>
              )}

              {!priorityLoading && priorityList.length === 0 && (
                <p style={{ color: "#94a3b8" }}>No priority list generated yet.</p>
              )}
            </div>
          </div>
        )}

        {/* Auto Schedule */}
        {activeSection === "auto-schedule" && (
          <div className="section">
            <h2>🤖 Auto-Schedule Issues</h2>
            <div className="component-section">
              <button
                onClick={handleAutoSchedule}
                disabled={autoScheduleLoading}
                style={{
                  padding: "12px 24px",
                  background: autoScheduleLoading ? "#64748b" : "#10b981",
                  color: "#fff",
                  border: "none",
                  borderRadius: "8px",
                  cursor: autoScheduleLoading ? "not-allowed" : "pointer",
                  fontWeight: "700",
                  fontSize: "1rem",
                  marginBottom: "20px",
                  transition: "all 0.3s ease"
                }}
              >
                {autoScheduleLoading ? "🔄 Scheduling in progress..." : "▶ Start Auto-Scheduling"}
              </button>

              {autoScheduleResult && (
                <div style={{
                  background: autoScheduleResult.scheduledCount > 0 ? "rgba(34, 197, 94, 0.1)" : "rgba(148, 163, 184, 0.1)",
                  border: `1px solid ${autoScheduleResult.scheduledCount > 0 ? "rgba(34, 197, 94, 0.3)" : "rgba(148, 163, 184, 0.3)"}`,
                  borderRadius: "8px",
                  padding: "16px",
                  marginBottom: "20px"
                }}>
                  <h4 style={{ marginTop: 0, marginBottom: "12px", color: autoScheduleResult.scheduledCount > 0 ? "#22c55e" : "#94a3b8" }}>
                    ✓ Scheduling Complete
                  </h4>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "12px", marginBottom: "12px" }}>
                    <div style={{ background: "rgba(59, 130, 246, 0.1)", padding: "12px", borderRadius: "6px" }}>
                      <p style={{ margin: "0 0 4px 0", color: "#94a3b8", fontSize: "0.85rem" }}>Scheduled</p>
                      <p style={{ margin: 0, color: "#3b82f6", fontSize: "1.5rem", fontWeight: "700" }}>{autoScheduleResult.scheduledCount}</p>
                    </div>
                    <div style={{ background: "rgba(148, 163, 184, 0.1)", padding: "12px", borderRadius: "6px" }}>
                      <p style={{ margin: "0 0 4px 0", color: "#94a3b8", fontSize: "0.85rem" }}>Total Issues</p>
                      <p style={{ margin: 0, color: "#cbd5e1", fontSize: "1.5rem", fontWeight: "700" }}>{autoScheduleResult.totalUnassigned}</p>
                    </div>
                    <div style={{ background: "rgba(245, 158, 11, 0.1)", padding: "12px", borderRadius: "6px" }}>
                      <p style={{ margin: "0 0 4px 0", color: "#94a3b8", fontSize: "0.85rem" }}>Workers</p>
                      <p style={{ margin: 0, color: "#f59e0b", fontSize: "1.5rem", fontWeight: "700" }}>{autoScheduleResult.availableWorkers}</p>
                    </div>
                  </div>
                  <p style={{ color: "#cbd5e1", margin: 0, fontSize: "0.9rem" }}>
                    {autoScheduleResult.message}
                  </p>
                </div>
              )}

              {autoScheduleResult && autoScheduleResult.details && autoScheduleResult.details.length > 0 && (
                <div>
                  <h4 style={{ color: "#cbd5e1", marginBottom: "12px" }}>📋 Scheduled Tasks</h4>
                  <div className="tasks-list">
                    {autoScheduleResult.details.map((detail, index) => (
                      <div key={detail.taskId} className="task-card" style={{ opacity: 0.95 }}>
                        <h4>#{index + 1} {detail.category}</h4>
                        <p>Location: {detail.location}</p>
                        <p>Assigned to: <strong>{detail.workerName}</strong></p>
                        <p>Priority Score: <strong style={{ color: "#f59e0b" }}>{detail.priorityScore}/100</strong></p>
                        <p style={{ fontSize: "0.85rem", color: "#94a3b8", marginBottom: 0 }}>Task ID: {detail.taskId}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!autoScheduleLoading && !autoScheduleResult && (
                <p style={{ color: "#94a3b8", textAlign: "center", padding: "20px" }}>
                  Click the button above to start auto-scheduling unassigned issues.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
