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

  return (
    <div className="app">
      <header className="app-header">
        <h1>Smart Infrastructure Management</h1>
        <div className="user-info">
          <span>{user?.role.toUpperCase()}: {user?.name || user?.email}</span>
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        </div>
      </header>

      <main>
        {user?.role === "admin" && <AdminDashboard token={token} />}
        {user?.role === "user" && <UserDashboard token={token} />}
        {user?.role === "worker" && <WorkerDashboard token={token} />}
      </main>
    </div>
  );
}

export default App;
