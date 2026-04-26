import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import axios from "axios";
import Login from "./components/Login";
import LandingPage from "./components/LandingPage";
import AdminDashboard from "./components/AdminDashboard";
import UserDashboard from "./components/UserDashboard";
import WorkerDashboard from "./components/WorkerDashboard";

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

function AppContent() {
  const navigate = useNavigate();
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [user, setUser] = useState(localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user")) : null);

  const handleLogin = (token, userData) => {
    setToken(token);
    setUser(userData);
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  // Set default axios headers
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    }
  }, [token]);

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={!token ? <Login onLogin={handleLogin} /> : <Navigate to="/dashboard" />} />

      {/* Protected Routes */}
      {token && user?.role === "admin" && (
        <Route path="/dashboard" element={<AdminDashboard token={token} onLogout={handleLogout} />} />
      )}
      {token && user?.role === "user" && (
        <Route path="/dashboard" element={<UserDashboardWrapper token={token} user={user} onLogout={handleLogout} />} />
      )}
      {token && user?.role === "worker" && (
        <Route path="/dashboard" element={<WorkerDashboardWrapper token={token} user={user} onLogout={handleLogout} />} />
      )}

      {/* Fallback */}
      <Route path="*" element={<Navigate to={token ? "/dashboard" : "/"} />} />
    </Routes>
  );
}

// Wrapper components for dashboards
function AdminDashboardWrapper({ token, onLogout }) {
  return <AdminDashboard token={token} onLogout={onLogout} />;
}

function UserDashboardWrapper({ token, user, onLogout }) {
  return (
    <div className={`app ${user?.role === "worker" || user?.role === "user" ? "with-sidebar" : ""}`}>
      <header className="dashboard-header">
        <h1>UrbanResolve Management</h1>
        <div className="header-actions">
          <div className="user-info">
            <span>{user?.role?.toUpperCase()}</span>
            <span>{user?.name || user?.email}</span>
          </div>
          <button onClick={onLogout} className="logout-btn">Logout</button>
        </div>
      </header>

      <main>
        {user?.role === "user" && <UserDashboard token={token} onLogout={onLogout} />}
        {user?.role === "worker" && <WorkerDashboard token={token} onLogout={onLogout} />}
      </main>
    </div>
  );
}

function WorkerDashboardWrapper({ token, user, onLogout }) {
  return (
    <div className="app">
      <header className="dashboard-header">
        <h1>UrbanResolve Management</h1>
        <div className="header-actions">
          <div className="user-info">
            <span>{user?.role?.toUpperCase()}</span>
            <span>{user?.name || user?.email}</span>
          </div>
        </div>
      </header>

      <main>
        <WorkerDashboard token={token} onLogout={onLogout} />
      </main>
    </div>
  );
}

export default App;
