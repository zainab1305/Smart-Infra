import { useState, useEffect } from "react";
import axios from "axios";
import Login from "./components/Login";
import AdminDashboard from "./components/AdminDashboard";
import UserDashboard from "./components/UserDashboard";
import WorkerDashboard from "./components/WorkerDashboard";

function App() {
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
  };

  // Set default axios headers
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    }
  }, [token]);

  if (!token) {
    return <Login onLogin={handleLogin} />;
  }

  // Admin dashboard handles its own layout
  if (user?.role === "admin") {
    return <AdminDashboard token={token} onLogout={handleLogout} />;
  }

  // Other dashboards use the standard wrapper layout
  return (
    <div className="app">
      <header className="dashboard-header">
        <h1>Smart Infrastructure Management</h1>
        <div className="header-actions">
          <div className="user-info">
            <span>{user?.role?.toUpperCase()}</span>
            <span>{user?.name || user?.email}</span>
          </div>
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        </div>
      </header>

      <main>
        {user?.role === "user" && <UserDashboard token={token} onLogout={handleLogout} />}
        {user?.role === "worker" && <WorkerDashboard token={token} onLogout={handleLogout} />}
      </main>
    </div>
  );
}

export default App;
