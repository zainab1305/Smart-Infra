import { useState } from "react";
import axios from "axios";
import "./IssueReport.css";

const CATEGORIES = [
  "Road Damage",
  "Water Leakage",
  "Street Light",
  "Garbage",
  "Others",
];

export default function IssueReport() {
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");
  const [image, setImage] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const submitIssue = async (e) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData();
    formData.append("category", category);
    formData.append("location", location);
    formData.append("image", image);

    try {
      const res = await axios.post(
        "http://localhost:5000/api/issues",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      setResult(res.data);
    } catch (err) {
      alert("Failed to submit issue");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="card">
        <h2 className="title">Infrastructure Issue Reporting</h2>
        <p className="subtitle">
          Submit verified issues to assist smart prioritization
        </p>

        <form onSubmit={submitIssue}>
          <div className="field">
            <label>Issue Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
            >
              <option value="">Select category</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label>Location</label>
            <input
              type="text"
              placeholder="e.g. Main Road, Sector 5"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              required
            />
          </div>

          <div className="field">
            <label>Upload Image Evidence</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImage(e.target.files[0])}
              required
            />
          </div>

          <button type="submit" disabled={loading}>
            {loading ? "Analyzing..." : "Submit Issue"}
          </button>
        </form>

        {result && (
          <div className="result">
            <h3>System Evaluation</h3>
            <div className="score-row">
              <span>Confidence Score</span>
              <span className="score">{result.confidenceScore}</span>
            </div>
            <div className="score-row">
              <span>Priority Score</span>
              <span className="score highlight">
                {result.priorityScore}
              </span>
            </div>
            <div className="status">
              Status: <b>{result.status}</b>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
