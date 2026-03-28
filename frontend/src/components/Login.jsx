import { useState, useEffect } from "react";
import axios from "axios";
import "./Login.css";

// Background image path (ensure file is in public folder)
// PUT YOUR IMAGE FILE NAME HERE - place the image file in the public/ folder
// Background images for different themes
const BG_DARK = "ej-yao-D46mXLsQRJw-unsplash.jpg";
const BG_LIGHT = "/images/light2.jpg";
export default function Login({ onLogin }) {
  const [theme, setTheme] = useState("light");
  const [selectedRole, setSelectedRole] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "light";
    setTheme(savedTheme);
    document.documentElement.setAttribute("data-theme", savedTheme);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
  };

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

  if (selectedRole) {
    return (
      <div className="login-expanded-container" style={{ backgroundImage: `url('${theme === "dark" ? BG_DARK : BG_LIGHT}')` }}>
        <button 
          className="back-to-columns-btn"
          onClick={() => {
            setSelectedRole(null);
            setError("");
          }}
        >
          ← Back to Login Options
        </button>

        {error && <div className="error-message">{error}</div>}
        
        {selectedRole === "admin" && (
          <form onSubmit={handleAdminLogin} className="expanded-form">
            <h2 className="form-title">Admin Portal</h2>
            <p className="form-subtitle">Manage infrastructure and workforce with precision</p>
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
            <p style={{ marginTop: "15px", fontSize: "12px", color: "#a0aec0", textAlign: "center" }}>
              Default: admin@smartinfra.com / admin123
            </p>
          </form>
        )}

        {selectedRole === "user" && (
          <>
            {!isRegister ? (
              <form onSubmit={handleUserLogin} className="expanded-form">
                <h2 className="form-title">Report Issues</h2>
                <p className="form-subtitle">Submit infrastructure problems in real-time</p>
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
                <p style={{ marginTop: "15px", textAlign: "center", color: "#a0aec0" }}>
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
              <form onSubmit={handleUserRegister} className="expanded-form">
                <h2 className="form-title">Create Account</h2>
                <p className="form-subtitle">Join our community and start reporting</p>
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
                <p style={{ marginTop: "15px", textAlign: "center", color: "#a0aec0" }}>
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

        {selectedRole === "worker" && (
          <form onSubmit={handleWorkerLogin} className="expanded-form">
            <h2 className="form-title">Worker Access</h2>
            <p className="form-subtitle">Login to view and complete assigned tasks</p>
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
            <p style={{ marginTop: "15px", fontSize: "12px", color: "#a0aec0", textAlign: "center" }}>
              Contact your admin for Worker ID and password
            </p>
          </form>
        )}
      </div>
    );
  }

  // Three Column View
  return (
    <div className="login-columns-container" style={{ backgroundImage: `url('${theme === "dark" ? BG_DARK : BG_LIGHT}')` }}>
      <button className="theme-toggle" onClick={toggleTheme} title="Toggle theme">
        {theme === 'dark' ? '☀️' : '🌙'}
      </button>
      
      <div className="columns-header">
        <h1>Smart Infrastructure Dashboard</h1>
        <p>Select your role to login</p>
      </div>

      <div className="columns-grid">
        {/* Admin Column */}
        <div 
          className="login-column admin-column"
          onClick={() => setSelectedRole("admin")}
        >
          <div className="column-content">
            <div className="column-icon">👨‍💼</div>
            <h2>Admin</h2>
            <p>Manage infrastructure and assign tasks</p>
            <button className="column-btn">Login as Admin</button>
          </div>
        </div>

        {/* User Column */}
        <div 
          className="login-column user-column"
          onClick={() => setSelectedRole("user")}
        >
          <div className="column-content">
            <div className="column-icon">👤</div>
            <h2>User</h2>
            <p>Report infrastructure issues</p>
            <button className="column-btn">Login as User</button>
          </div>
        </div>

        {/* Worker Column */}
        <div 
          className="login-column worker-column"
          onClick={() => setSelectedRole("worker")}
        >
          <div className="column-content">
            <div className="column-icon">👷</div>
            <h2>Worker</h2>
            <p>Accept and complete assigned tasks</p>
            <button className="column-btn">Login as Worker</button>
          </div>
        </div>
      </div>
    </div>
  );
}
