import { useState, useEffect } from "react";
import axios from "axios";
import "./Login.css";

export default function WorkerDashboard({ token }) {
  const [activeSection, setActiveSection] = useState("tasks");
  const [myTasks, setMyTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedTask, setSelectedTask] = useState(null);
  const [response, setResponse] = useState({ accepted: null, feedback: "" });

  useEffect(() => {
    fetchMyTasks();
  }, []);

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

  const pendingTasks = myTasks.filter((t) => t.status === "Pending");
  const inProgressTasks = myTasks.filter((t) => t.status === "In Progress");
  const completedTasks = myTasks.filter((t) => t.status === "Completed");

  return (
    <div className="dashboard">
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
      </nav>

      <div className="dashboard-content">
        {error && <div className="error-message">{error}</div>}

        {activeSection === "tasks" && (
          <div className="section">
            <h2>My Weekly Tasks</h2>

            <div className="stats-grid">
              <div className="stat-card">
                <h3>Pending</h3>
                <p className="stat-number">{pendingTasks.length}</p>
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
                <h3>Total</h3>
                <p className="stat-number">{myTasks.length}</p>
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
                <p><strong>Due Date:</strong> {new Date(selectedTask.dueDate).toLocaleDateString()}</p>

                {selectedTask.status === "Pending" && (
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
              <div className="tasks-list">
                <div className="task-section">
                  <h3>⏸ Pending Tasks ({pendingTasks.length})</h3>
                  {pendingTasks.map((task) => (
                    <div key={task._id} className="task-card">
                      <h4>{task.issueId?.category}</h4>
                      <p>{task.issueId?.location}</p>
                      <p>Priority: {task.issueId?.priorityScore}</p>
                      <button onClick={() => setSelectedTask(task)} className="view-btn">
                        View Details
                      </button>
                    </div>
                  ))}
                </div>

                <div className="task-section">
                  <h3>⏳ In Progress Tasks ({inProgressTasks.length})</h3>
                  {inProgressTasks.map((task) => (
                    <div key={task._id} className="task-card">
                      <h4>{task.issueId?.category}</h4>
                      <p>{task.issueId?.location}</p>
                      <p>Priority: {task.issueId?.priorityScore}</p>
                      <button onClick={() => setSelectedTask(task)} className="view-btn">
                        View Details
                      </button>
                    </div>
                  ))}
                </div>

                <div className="task-section">
                  <h3>✓ Completed Tasks ({completedTasks.length})</h3>
                  {completedTasks.map((task) => (
                    <div key={task._id} className="task-card completed">
                      <h4>{task.issueId?.category}</h4>
                      <p>{task.issueId?.location}</p>
                      <p>Completed on: {new Date(task.updatedAt).toLocaleDateString()}</p>
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
            <div className="stats-grid">
              <div className="stat-card">
                <h3>Completion Rate</h3>
                <p className="stat-number">
                  {myTasks.length > 0
                    ? Math.round((completedTasks.length / myTasks.length) * 100)
                    : 0}
                  %
                </p>
              </div>
              <div className="stat-card">
                <h3>Tasks Completed</h3>
                <p className="stat-number">{completedTasks.length}</p>
              </div>
              <div className="stat-card">
                <h3>Tasks in Progress</h3>
                <p className="stat-number">{inProgressTasks.length}</p>
              </div>
              <div className="stat-card">
                <h3>Pending Response</h3>
                <p className="stat-number">{pendingTasks.length}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
