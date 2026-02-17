import { useState } from "react";
import axios from "axios";
import "./Login.css";

export default function Login({ onLogin }) {
  const [activeTab, setActiveTab] = useState("admin");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Admin Login
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");

  // User Registration
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userPassword, setUserPassword] = useState("");
  const [userPhone, setUserPhone] = useState("");
  const [isRegister, setIsRegister] = useState(false);

  // User Login
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Worker Login
  const [workerID, setWorkerID] = useState("");
  const [workerPassword, setWorkerPassword] = useState("");

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await axios.post("http://localhost:5000/api/auth/login/admin", {
        email: adminEmail,
        password: adminPassword,
      });

      onLogin(response.data.token, response.data.user);
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleUserRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await axios.post("http://localhost:5000/api/auth/register/user", {
        name: userName,
        email: userEmail,
        password: userPassword,
        phone: userPhone,
      });

      onLogin(response.data.token, response.data.user);
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const handleUserLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await axios.post("http://localhost:5000/api/auth/login/user", {
        email: loginEmail,
        password: loginPassword,
      });

      onLogin(response.data.token, response.data.user);
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleWorkerLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await axios.post("http://localhost:5000/api/auth/login/worker", {
        workerId: workerID,
        password: workerPassword,
      });

      onLogin(response.data.token, response.data.user);
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>Smart Infrastructure Dashboard</h1>
        
        <div className="tabs">
          <button
            className={`tab ${activeTab === "admin" ? "active" : ""}`}
            onClick={() => setActiveTab("admin")}
          >
            Admin
          </button>
          <button
            className={`tab ${activeTab === "user" ? "active" : ""}`}
            onClick={() => setActiveTab("user")}
          >
            User
          </button>
          <button
            className={`tab ${activeTab === "worker" ? "active" : ""}`}
            onClick={() => setActiveTab("worker")}
          >
            Worker
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}

        {/* Admin Login */}
        {activeTab === "admin" && (
          <form onSubmit={handleAdminLogin} className="form">
            <h2>Admin Login</h2>
            <input
              type="email"
              placeholder="Admin Email"
              value={adminEmail}
              onChange={(e) => setAdminEmail(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              required
            />
            <button type="submit" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </button>
            <p style={{ marginTop: "10px", fontSize: "12px", color: "#666" }}>
              Default: admin@smartinfra.com / admin123
            </p>
          </form>
        )}

        {/* User Login/Register */}
        {activeTab === "user" && (
          <>
            {!isRegister ? (
              <form onSubmit={handleUserLogin} className="form">
                <h2>User Login</h2>
                <input
                  type="email"
                  placeholder="Email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  required
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                />
                <button type="submit" disabled={loading}>
                  {loading ? "Logging in..." : "Login"}
                </button>
                <p style={{ marginTop: "15px", textAlign: "center" }}>
                  Don't have an account?{" "}
                  <button
                    type="button"
                    onClick={() => setIsRegister(true)}
                    className="link-btn"
                  >
                    Register here
                  </button>
                </p>
              </form>
            ) : (
              <form onSubmit={handleUserRegister} className="form">
                <h2>User Registration</h2>
                <input
                  type="text"
                  placeholder="Full Name"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  required
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  required
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={userPassword}
                  onChange={(e) => setUserPassword(e.target.value)}
                  required
                />
                <input
                  type="tel"
                  placeholder="Phone (optional)"
                  value={userPhone}
                  onChange={(e) => setUserPhone(e.target.value)}
                />
                <button type="submit" disabled={loading}>
                  {loading ? "Registering..." : "Register"}
                </button>
                <p style={{ marginTop: "15px", textAlign: "center" }}>
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => setIsRegister(false)}
                    className="link-btn"
                  >
                    Login here
                  </button>
                </p>
              </form>
            )}
          </>
        )}

        {/* Worker Login */}
        {activeTab === "worker" && (
          <form onSubmit={handleWorkerLogin} className="form">
            <h2>Worker Login</h2>
            <input
              type="text"
              placeholder="Worker ID"
              value={workerID}
              onChange={(e) => setWorkerID(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={workerPassword}
              onChange={(e) => setWorkerPassword(e.target.value)}
              required
            />
            <button type="submit" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </button>
            <p style={{ marginTop: "10px", fontSize: "12px", color: "#666" }}>
              Contact your admin for Worker ID and password
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
