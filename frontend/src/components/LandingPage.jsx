import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import "./LandingPage.css";

function LandingPage() {
  const [heroGlow, setHeroGlow] = useState({ x: 0, y: 0, opacity: 0 });
  const [theme, setTheme] = useState("dark");
  const heroRef = useRef(null);

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "dark";
    setTheme(savedTheme);
    document.documentElement.setAttribute("data-theme", savedTheme);
  }, []);

  // Handle theme toggle
  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
  };

  const handleCTA = (e) => {
    e?.preventDefault();
    // Navigate to login
    window.location.href = "/login";
  };

  const handleHeroMouseMove = (e) => {
    const rect = heroRef.current?.getBoundingClientRect();
    if (rect) {
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setHeroGlow({ x, y, opacity: 1 });
    }
  };

  const handleHeroMouseLeave = () => {
    setHeroGlow({ x: 0, y: 0, opacity: 0 });
  };

  return (
    <div className="landing-page">
      {/* Navigation */}
      <nav className="landing-nav">
        <div className="nav-container">
          <div className="nav-logo">Smart Infra</div>
          <ul className="nav-links">
            <li><a href="#features">Features</a></li>
            <li><a href="#about">About</a></li>
            <li><a href="#services">Services</a></li>
            <li><a href="#cta" className="nav-btn">Get Started</a></li>
          </ul>
          
          {/* Theme Toggle Switch */}
          <div className="theme-toggle-container">
            <button 
              className="theme-toggle"
              onClick={toggleTheme}
              aria-label="Toggle theme"
              title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section 
        className="hero-section" 
        ref={heroRef}
        onMouseMove={handleHeroMouseMove}
        onMouseLeave={handleHeroMouseLeave}
      >
        <div className="hero-glow" style={{
          left: `${heroGlow.x}px`,
          top: `${heroGlow.y}px`,
          opacity: heroGlow.opacity
        }}></div>
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <h1 className="hero-title">Smart Infrastructure Dashboard</h1>
          <p className="hero-subtitle">Smarter Cities Start with Smarter Monitoring</p>
          <p className="hero-description">
            Real-time infrastructure monitoring, predictive maintenance, and intelligent resource management
          </p>
          <a href="#cta" className="hero-btn">Explore Now</a>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features-section">
        <div className="section-container">
          <h2 className="section-title">Our Features</h2>
          <p className="section-subtitle">Comprehensive tools for modern infrastructure management</p>
          
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <h3>Real-Time Monitoring</h3>
              <p>Track infrastructure metrics in real-time with live dashboard updates and instant alerts</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🔧</div>
              <h3>Predictive Maintenance</h3>
              <p>AI-powered predictive analytics to prevent failures before they happen</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">👥</div>
              <h3>Task Management</h3>
              <p>Streamlined assignment and tracking of maintenance tasks for your team</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📸</div>
              <h3>Issue Reporting</h3>
              <p>Easy-to-use reporting system with photo uploads and priority levels</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📈</div>
              <h3>Analytics & Reports</h3>
              <p>Comprehensive weekly reports and performance analytics for informed decisions</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🔐</div>
              <h3>Secure Access</h3>
              <p>Role-based access control and secure authentication for all users</p>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="about-section">
        <div className="section-container">
          <h2 className="section-title">About Our System</h2>
          
          <div className="about-content">
            <div className="about-text">
              <p>
                Smart Infrastructure Dashboard is designed for modern city management, combining cutting-edge technology 
                with user-friendly interfaces to ensure optimal infrastructure performance and maintenance.
              </p>
              <p>
                Our platform empowers municipalities, facility managers, and maintenance teams to work together seamlessly, 
                reducing downtime and improving service delivery.
              </p>
            </div>

            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-number">500+</div>
                <div className="stat-label">Active Users</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">100+</div>
                <div className="stat-label">Issues Resolved</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">98%</div>
                <div className="stat-label">Uptime</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">24/7</div>
                <div className="stat-label">Support</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="services-section">
        <div className="section-container">
          <h2 className="section-title">Our Services</h2>
          <p className="section-subtitle">Complete infrastructure management solutions</p>

          <div className="services-grid">
            <div className="service-card active">
              <h3>Infrastructure Monitoring</h3>
              <p>24/7 monitoring of critical infrastructure systems with automated alerts and notifications</p>
            </div>
            <div className="service-card">
              <h3>Maintenance Planning</h3>
              <p>Intelligent scheduling and planning of maintenance activities to minimize disruptions</p>
            </div>
            <div className="service-card">
              <h3>Asset Management</h3>
              <p>Comprehensive tracking and management of all infrastructure assets and resources</p>
            </div>
            <div className="service-card">
              <h3>Performance Analytics</h3>
              <p>In-depth analytics and reporting to optimize infrastructure performance and costs</p>
            </div>
            <div className="service-card">
              <h3>Team Collaboration</h3>
              <p>Real-time collaboration tools for teams to work efficiently on maintenance tasks</p>
            </div>
            <div className="service-card">
              <h3>Data Integration</h3>
              <p>Seamless integration with existing systems and IoT devices for unified management</p>
            </div>
          </div>
        </div>
      </section>

      {/* Gallery Section */}
      <section className="gallery-section">
        <div className="section-container">
          <h2 className="section-title">Infrastructure Portfolio</h2>
          <p className="section-subtitle">Examples of systems we monitor and manage</p>

          <div className="gallery-grid">
            <div className="gallery-item">
              <div className="gallery-image water-systems"></div>
              <h3>Water Management Systems</h3>
              <p>Real-time monitoring of water distribution and treatment facilities</p>
            </div>
            <div className="gallery-item">
              <div className="gallery-image power-grid"></div>
              <h3>Power Grid Management</h3>
              <p>Monitoring electrical infrastructure and distribution networks</p>
            </div>
            <div className="gallery-item">
              <div className="gallery-image transport"></div>
              <h3>Transportation Networks</h3>
              <p>Managing roads, bridges, and public transportation infrastructure</p>
            </div>
            <div className="gallery-item">
              <div className="gallery-image buildings"></div>
              <h3>Building Systems</h3>
              <p>Smart monitoring of HVAC, lighting, and facility management systems</p>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="trust-section">
        <div className="section-container">
          <h2 className="section-title">Trusted by Cities Worldwide</h2>
          <p className="section-subtitle">Join hundreds of organizations improving their infrastructure</p>

          <div className="trust-content">
            <div className="trust-stat">
              <div className="trust-number">50+</div>
              <div className="trust-text">Sensors Conected</div>
            </div>
            <div className="trust-stat">
              <div className="trust-number">100+</div>
              <div className="trust-text">Assets Monitored</div>
            </div>
            <div className="trust-stat">
              <div className="trust-number">99.8%</div>
              <div className="trust-text">System Reliability</div>
            </div>
            <div className="trust-stat">
              <div className="trust-number">50+</div>
              <div className="trust-text">Cities Supported</div>
            </div>
          </div>

          <div className="testimonial-section">
            <h3>What Our Users Say</h3>
            <div className="testimonials">
              <div className="testimonial">
                <p>"This system has reduced our maintenance costs by 40% while improving response times."</p>
                <span>- City Manager, Metropolitan Council</span>
              </div>
              <div className="testimonial">
                <p>"The real-time alerts have prevented several critical infrastructure failures."</p>
                <span>- Operations Director, Infrastructure Authority</span>
              </div>
              <div className="testimonial">
                <p>"Our teams are now 3x more efficient with the task management features."</p>
                <span>- Team Lead, Public Works Department</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="cta" className="cta-section">
        <div className="cta-container">
          <h2>Ready to Transform Your Infrastructure Management?</h2>
          <p>Join us and experience the future of smart city monitoring</p>
          
          <button className="cta-btn" onClick={handleCTA}>Get Started Now</button>

          <p className="form-note">Access your dashboard and start monitoring today</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer-section">
        <div className="footer-container">
          <div className="footer-content">
            <div className="footer-col">
              <h4>About Smart Infrastructure Dashboard</h4>
              <p>
                A comprehensive platform for monitoring, managing, and optimizing infrastructure systems 
                in modern cities. Designed to help municipalities and facility managers work smarter.
              </p>
            </div>

            <div className="footer-col">
              <h4>Created By</h4>
              <ul>
                <li>Yesha Tandel - yeshatandel07@gmail.com</li>
                <li>Zainab Jambughoda - zainabjambughoda13@gmail.com</li>
              </ul>
            </div>

            <div className="footer-col">
              <h4>Quick Links</h4>
              <ul>
                <li><a href="#features">Features</a></li>
                <li><a href="#services">Services</a></li>
                <li><a href="#about">About</a></li>
                <li><a href="#cta">Contact</a></li>
              </ul>
            </div>

       
          </div>

          <div className="footer-bottom">
            <p>&copy; 2024 Smart Infrastructure Dashboard. All rights reserved.</p>
            <div className="social-links">
              <a href="#">Twitter</a>
              <a href="#">LinkedIn</a>
              <a href="#">GitHub</a>
              <a href="#">Facebook</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
