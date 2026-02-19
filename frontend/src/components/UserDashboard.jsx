import { useState, useEffect } from "react";
import axios from "axios";
import "./Login.css";

export default function UserDashboard({ token }) {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [newIssue, setNewIssue] = useState({
    category: "Road Damage",
    location: "",
  });
  const [imageFile, setImageFile] = useState(null);

  useEffect(() => {
    fetchIssues();
  }, []);

  const fetchIssues = async () => {
    setLoading(true);
    try {
      const res = await axios.get("http://localhost:5000/api/issues", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setIssues(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch issues");
    } finally {
      setLoading(false);
    }
  };

  const handleReportIssue = async (e) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData();
    formData.append("category", newIssue.category);
    formData.append("location", newIssue.location);
    if (imageFile) {
      formData.append("image", imageFile);
    }

    try {
      await axios.post("http://localhost:5000/api/issues", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      alert("Issue reported successfully!");
      setNewIssue({ category: "Road Damage", location: "" });
      setImageFile(null);
      fetchIssues();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to report issue");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Reported":
        return "#ff9800";
      case "Assigned":
        return "#2196f3";
      case "Resolved":
        return "#4caf50";
      default:
        return "#666";
    }
  };

  return (
    <div className="dashboard">
      <div className="dashboard-content">
        <div className="section">
          <h2>Report Infrastructure Issues</h2>

          <form onSubmit={handleReportIssue} className="form">
            <select
              value={newIssue.category}
              onChange={(e) => setNewIssue({ ...newIssue, category: e.target.value })}
              required
            >
              <option value="Road Damage">Road Damage</option>
              <option value="Water Leakage">Water Leakage</option>
              <option value="Street Light">Street Light</option>
              <option value="Garbage">Garbage</option>
              <option value="Others">Others</option>
            </select>

            <input
              type="text"
              placeholder="Location"
              value={newIssue.location}
              onChange={(e) => setNewIssue({ ...newIssue, location: e.target.value })}
              required
            />

            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImageFile(e.target.files[0])}
            />

            <button type="submit" disabled={loading}>
              {loading ? "Reporting..." : "Report Issue"}
            </button>
          </form>

          {error && <div className="error-message">{error}</div>}

          <h2>Your Reported Issues</h2>
          <div className="issues-list">
            {issues.length === 0 ? (
              <p>No issues reported yet</p>
            ) : (
              issues.map((issue) => (
                <div key={issue._id} className="issue-card">
                  <div className="issue-header">
                    <h3>{issue.category}</h3>
                    <span
                      className={`status-badge status-${issue.status}`}
                    >
                      {issue.status}
                    </span>
                  </div>

                  <p><strong>Location:</strong> {issue.location}</p>
                  <p><strong>Reported:</strong> {new Date(issue.createdAt).toLocaleDateString()}</p>
                  <p><strong>Priority:</strong> {issue.priorityScore}/100</p>
                  <p><strong>Confidence:</strong> {(issue.confidenceScore * 100).toFixed(1)}%</p>

                  {issue.explanation && (
                    <div className="explanation">
                      <strong>Analysis:</strong> {issue.explanation}
                    </div>
                  )}

                  {issue.imageUrl && (
                    <img
                      src={`http://localhost:5000/${issue.imageUrl}`}
                      alt={issue.category}
                      style={{ maxWidth: "100%", marginTop: "10px" }}
                    />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
