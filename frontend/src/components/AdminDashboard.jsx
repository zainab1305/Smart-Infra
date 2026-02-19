import { useState, useEffect } from "react";
import axios from "axios";
import "./Login.css";

export default function AdminDashboard({ token }) {
  const [activeSection, setActiveSection] = useState("home");
  const [users, setUsers] = useState([]);
  const [issues, setIssues] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [weekSummary, setWeekSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
  }, []);

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

  const workers = users.filter((u) => u.role === "worker");
  const regularUsers = users.filter((u) => u.role === "user");
  const unassignedIssues = issues.filter((i) => i.status === "Reported");

  return (
    <div className="dashboard">
      <nav className="dashboard-nav">
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
      </nav>

      <div className="dashboard-content">
        {error && <div className="error-message">{error}</div>}

        {/* Dashboard Home */}
        {activeSection === "home" && (
          <div className="section">
            <h2>Weekly Dashboard Summary</h2>
            <div className="stats-grid">
              <div className="stat-card">
                <h3>Total Workers</h3>
                <p className="stat-number">{workers.length}</p>
              </div>
              <div className="stat-card">
                <h3>Total Users</h3>
                <p className="stat-number">{regularUsers.length}</p>
              </div>
              <div className="stat-card">
                <h3>Total Issues</h3>
                <p className="stat-number">{issues.length}</p>
              </div>
              <div className="stat-card">
                <h3>Unassigned Issues</h3>
                <p className="stat-number">{unassignedIssues.length}</p>
              </div>
            </div>

            {weekSummary && (
              <div className="week-summary">
                <h3>Week {weekSummary.weekNumber} - {weekSummary.year}</h3>
                <div className="workers-list">
                  {weekSummary.summary.map((workerData) => (
                    <div key={workerData.worker._id} className="worker-card">
                      <h4>{workerData.worker.name}</h4>
                      <p>Worker ID: {workerData.worker.workerId}</p>
                      <div className="task-stats">
                        <span>Total: {workerData.totalTasks}</span>
                        <span style={{ color: "green" }}>✓ Completed: {workerData.completed}</span>
                        <span style={{ color: "blue" }}>⏳ In Progress: {workerData.inProgress}</span>
                        <span style={{ color: "orange" }}>⏸ Pending: {workerData.pending}</span>
                        <span style={{ color: "red" }}>✗ Rejected: {workerData.rejected}</span>
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
                {unassignedIssues.map((issue) => (
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
                  <p>Priority: {issue.priorityScore}</p>
                  <p>Status: <span className={`status-badge status-${issue.status}`}>{issue.status}</span></p>
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
      </div>
    </div>
  );
}
