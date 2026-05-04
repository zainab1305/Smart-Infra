import { useState, useEffect, useRef } from "react";
import axios from "axios";
import L from "leaflet";
import { MapContainer, Marker, TileLayer, useMapEvents } from "react-leaflet";
import "./Dashboard.css";

// Background images for dark and light themes (place files in public/ folder)
const BG_DARK = "/bg-dark.jpg";
const BG_LIGHT = "/bg-light.jpg";

L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function MapClickHandler({ onSelect }) {
  useMapEvents({
    click(event) {
      const latitude = Number(event.latlng.lat.toFixed(6));
      const longitude = Number(event.latlng.lng.toFixed(6));
      onSelect(latitude, longitude);
    },
  });

  return null;
}

export default function UserDashboard({ token }) {
  const [theme, setTheme] = useState("dark");
  const [activeTab, setActiveTab] = useState("report");
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [locationError, setLocationError] = useState("");
  const [locationLoading, setLocationLoading] = useState(false);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [imageSource, setImageSource] = useState("");
  const [locationMethod, setLocationMethod] = useState("manual");
  const [imageMethod, setImageMethod] = useState("");
  const [newIssue, setNewIssue] = useState({
    category: "Road Damage",
    location: "",
    address: "",
    latitude: null,
    longitude: null,
  });
  const [imageFile, setImageFile] = useState(null);
  const cameraInputRef = useRef(null);
  const uploadInputRef = useRef(null);

  const fallbackCenter = { lat: 23.0225, lng: 72.5714 };
  const markerPosition =
    newIssue.latitude !== null && newIssue.longitude !== null
      ? { lat: newIssue.latitude, lng: newIssue.longitude }
      : fallbackCenter;

  useEffect(() => {
    fetchIssues();
    // Auto-refresh every 10 seconds to see status updates
    const interval = setInterval(fetchIssues, 10000);
    
    // Load theme from localStorage
    const savedTheme = localStorage.getItem("theme") || "dark";
    setTheme(savedTheme);
    document.documentElement.setAttribute("data-theme", savedTheme);
    
    return () => clearInterval(interval);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
  };

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

  const reverseGeocode = async (latitude, longitude) => {
    const endpoint = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`;
    const response = await fetch(endpoint);

    if (!response.ok) {
      throw new Error("Unable to fetch address for selected location");
    }

    const data = await response.json();
    if (data.display_name) {
      return data.display_name;
    }

    return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
  };

  const applySelectedLocation = async (latitude, longitude) => {
    setLocationLoading(true);
    setLocationError("");

    try {
      const address = await reverseGeocode(latitude, longitude);
      setNewIssue((prev) => ({
        ...prev,
        latitude,
        longitude,
        address,
        location: address,
      }));
    } catch (err) {
      const fallbackAddress = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
      setNewIssue((prev) => ({
        ...prev,
        latitude,
        longitude,
        address: fallbackAddress,
        location: fallbackAddress,
      }));
      setLocationError(err.message || "Location selected, but address lookup failed");
    } finally {
      setLocationLoading(false);
    }
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser");
      return;
    }

    setLocationLoading(true);
    setLocationError("");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const latitude = Number(position.coords.latitude.toFixed(6));
        const longitude = Number(position.coords.longitude.toFixed(6));
        await applySelectedLocation(latitude, longitude);
        setLocationMethod("current");
      },
      (geoError) => {
        setLocationLoading(false);
        setLocationError(geoError.message || "Failed to get current location");
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  };

  const handleMapSelection = () => {
    setShowMapPicker(true);
    setLocationError("");
    setLocationMethod("map");
  };

  const handleManualLocationChange = (value) => {
    setLocationError("");
    setNewIssue((prev) => ({
      ...prev,
      location: value,
      address: value,
      latitude: null,
      longitude: null,
    }));
  };

  const handleImageSelection = (file, source = "") => {
    if (!file) return;
    setImageFile(file);
    setImageSource(source);
  };

  const handleReportIssue = async (e) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData();
    formData.append("category", newIssue.category);
    const addressToStore = (newIssue.address || newIssue.location || "").trim();
    formData.append("location", addressToStore);
    formData.append("address", addressToStore);
    if (newIssue.latitude !== null && newIssue.longitude !== null) {
      formData.append("latitude", String(newIssue.latitude));
      formData.append("longitude", String(newIssue.longitude));
    }
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
      setNewIssue({
        category: "Road Damage",
        location: "",
        address: "",
        latitude: null,
        longitude: null,
      });
      setImageFile(null);
      setImageSource("");
      setImageMethod("");
      setLocationMethod("manual");
      setShowMapPicker(false);
      setLocationError("");
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
      <button 
        className="theme-toggle-dashboard" 
        onClick={toggleTheme} 
        title="Toggle theme"
        aria-label="Toggle dark/light theme"
      >
        {theme === 'dark' ? '☀️' : '🌙'}
      </button>

      {/* Navigation Bar */}
      <nav className="user-dashboard-nav">
        <div className="nav-tabs">
          <button
            className={`nav-tab ${activeTab === "report" ? "active" : ""}`}
            onClick={() => setActiveTab("report")}
          >
            📋 Report Issue
          </button>
          <button
            className={`nav-tab ${activeTab === "issues" ? "active" : ""}`}
            onClick={() => setActiveTab("issues")}
          >
            📁 Your Reported Issues
          </button>
        </div>
      </nav>

      <div className="dashboard-content">
        {/* Report Issue Section */}
        {activeTab === "report" && (
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

              {/* Location Selection Dropdown */}
              <div className="dropdown-section">
                <label>Choose Location Method</label>
                <select
                  value={locationMethod}
                  onChange={(e) => {
                    const method = e.target.value;
                    setLocationMethod(method);
                    setLocationError("");
                    if (method === "current") {
                      handleUseCurrentLocation();
                    } else if (method === "map") {
                      handleMapSelection();
                    }
                  }}
                  required
                >
                  <option value="manual">Manual Entry</option>
                  <option value="current">Use Current Location</option>
                  <option value="map">Select on Map</option>
                </select>
              </div>

              {/* Location Input
              {locationMethod === "manual" && (
                <input
                  type="text"
                  placeholder="Enter address manually"
                  value={newIssue.location}
                  onChange={(e) => handleManualLocationChange(e.target.value)}
                  required
                />
              )} */}

              {showMapPicker && (
                <div className="map-picker-wrapper">
                  <MapContainer
                    center={[markerPosition.lat, markerPosition.lng]}
                    zoom={13}
                    className="issue-map"
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <MapClickHandler onSelect={applySelectedLocation} />
                    <Marker
                      position={[markerPosition.lat, markerPosition.lng]}
                      draggable
                      eventHandlers={{
                        dragend: (event) => {
                          const marker = event.target;
                          const position = marker.getLatLng();
                          const latitude = Number(position.lat.toFixed(6));
                          const longitude = Number(position.lng.toFixed(6));
                          applySelectedLocation(latitude, longitude);
                        },
                      }}
                    >
                    </Marker>
                  </MapContainer>
                  <p className="location-help-text">Click anywhere on map or drag marker to choose location.</p>
                </div>
              )}

              {(newIssue.latitude !== null || newIssue.longitude !== null) && (
                <div className="selected-location-box">
                  <p><strong>Selected Address:</strong> {newIssue.address || newIssue.location}</p>
                  <p>
                    <strong>Coordinates:</strong> {newIssue.latitude ?? "-"}, {newIssue.longitude ?? "-"}
                  </p>
                </div>
              )}

              {locationError && <div className="error-message">{locationError}</div>}

              {/* Image Selection Dropdown */}
              <div className="dropdown-section">
                <label>Add Image</label>
                <select
                  value={imageMethod}
                  onChange={(e) => {
                    const method = e.target.value;
                    setImageMethod(method);
                    if (method === "upload") {
                      uploadInputRef.current?.click();
                    } else if (method === "camera") {
                      cameraInputRef.current?.click();
                    }
                  }}
                >
                  <option value="">Select image source</option>
                  <option value="upload">Upload from Device</option>
                  <option value="camera">Capture from Camera</option>
                </select>
              </div>

              {/* Hidden file inputs */}
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={(e) => {
                  handleImageSelection(e.target.files?.[0], "Camera");
                  e.target.value = "";
                  setImageMethod("");
                }}
                style={{ display: "none" }}
              />

              <input
                ref={uploadInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => {
                  handleImageSelection(e.target.files?.[0], "Device");
                  e.target.value = "";
                  setImageMethod("");
                }}
                style={{ display: "none" }}
              />

              {imageFile && (
                <p className="location-help-text">
                  Selected image ({imageSource || "File"}): {imageFile.name}
                </p>
              )}

              <div className="form-actions">
                <button type="submit" className="issue-report-btn" disabled={loading}>
                  {loading ? "Reporting..." : "Report Issue"}
                </button>

                <button
                  type="button"
                  className="form-reset-btn"
                  onClick={() => {
                    setNewIssue({
                      category: "Road Damage",
                      location: "",
                      address: "",
                      latitude: null,
                      longitude: null,
                    });
                    setImageFile(null);
                    setImageSource("");
                    setImageMethod("");
                    setLocationMethod("manual");
                    setShowMapPicker(false);
                    setLocationError("");
                  }}
                  disabled={loading}
                >
                  ↻ Reset
                </button>
              </div>
            </form>

            {error && <div className="error-message">{error}</div>}
          </div>
        )}

        {/* Your Reported Issues Section */}
        {activeTab === "issues" && (
          <div className="section">
            <div className="section-head-row">
              <h2>Your Reported Issues</h2>
              <button onClick={fetchIssues} disabled={loading} className="refresh-btn user-refresh-btn">
                🔄 {loading ? "Refreshing..." : "Refresh"}
              </button>
            </div>
            <div className="issues-list">
              {issues.length === 0 ? (
                <p>No issues reported yet</p>
              ) : (
                issues.map((issue) => (
                  <div key={issue._id} className="issue-card">
                    <div className="issue-header">
                      <h3>{issue.category}</h3>
                      <span
                        className={`status-badge status-${issue.status.replace(/\s+/g, "")}`}
                      >
                        {issue.status}
                      </span>
                    </div>

                    {issue.imageUrl && (
                      <img
                        src={`http://localhost:5000/${issue.imageUrl}`}
                        alt="Issue"
                        className="issue-card-image"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    )}

                    <p><strong>Location:</strong> {issue.address || issue.location}</p>
                    <p><strong>Reported:</strong> {new Date(issue.createdAt).toLocaleString()}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
