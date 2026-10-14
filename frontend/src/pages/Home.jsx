import { Link } from "react-router-dom";

function Home() {
  return (
    <div className="home-page">

      {/* Navigation Bar */}
      <nav className="navbar">
        <div className="logo">
          Smart Academic Planner and Notification System.
        </div>

        <div className="nav-links">
          <a href="#home">Home</a>
          <a href="#features">Features</a>
          <a href="#about">About</a>
          <Link to="/login" className="login-button">
            Login
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero" id="home">
        <div className="hero-content">
          <p className="hero-label">SMART ACADEMIC PLANNER</p>

          <h1>
            Plan Your Academic Life.
            <br />
            Stay on Track.
          </h1>

          <p className="hero-description">
            Organize your classes, assignments, tasks, assessments,
            and academic activities in one smart platform.
          </p>

          <div className="hero-buttons">
            <Link to="/register" className="primary-button">
              Get Started
            </Link>

            <a href="#features" className="secondary-button">
              Explore Features
            </a>
          </div>
        </div>

        <div className="hero-visual">
          <div className="dashboard-preview">
            <div className="preview-header">
              <span>Academic Overview</span>
              <span>•••</span>
            </div>

            <div className="preview-card">
              <span>Today's Classes</span>
              <strong>4 Classes</strong>
            </div>

            <div className="preview-card">
              <span>Assignments</span>
              <strong>3 Pending</strong>
            </div>

            <div className="preview-card">
              <span>Upcoming Assessments</span>
              <strong>2 This Week</strong>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section" id="features">
        <div className="section-heading">
          <p className="section-label">FEATURES</p>

          <h2>Everything You Need to Stay Organized</h2>

          <p>
            Smart Academic Planner brings your academic activities
            together in one simple and organized platform.
          </p>
        </div>

        <div className="features-grid">

          <div className="feature-card">
            <div className="feature-icon">📅</div>

            <h3>Smart Timetable</h3>

            <p>
              Keep track of your classes, units, lecturers, venues,
              and academic schedule in one place.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">📝</div>

            <h3>Assignments & Tasks</h3>

            <p>
              Manage assignments and academic tasks, track deadlines,
              and stay on top of your workload.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🔔</div>

            <h3>Smart Notifications</h3>

            <p>
              Receive reminders about upcoming assignments,
              assessments, classes, and important announcements.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">📊</div>

            <h3>Academic Performance</h3>

            <p>
              Monitor your academic progress and keep track of
              your assessment results and performance.
            </p>
          </div>

        </div>
      </section>

      {/* About Section */}
      <section className="about-section" id="about">
        <div className="about-content">

          <div className="about-text">
            <p className="section-label">ABOUT</p>

            <h2>A Smarter Way to Manage Academic Life</h2>

            <p>
              Smart Academic Planner is designed to make academic
              organization easier for students, lecturers, and academic
              administrators.
            </p>

            <p>
              Instead of managing timetables, assignments, assessments,
              tasks, and academic notifications separately, the platform
              brings everything together in one organized system.
            </p>

            <p>
              Whether you are planning your classes, managing
              assignments, monitoring academic performance, or
              coordinating academic activities, Smart Academic Planner
              helps you stay informed and on track.
            </p>
          </div>

          <div className="about-visual">
            <div className="about-card">
              <div className="about-card-item">
                <strong>Students</strong>
                <span>Organize & track academic activities</span>
              </div>

              <div className="about-card-item">
                <strong>Lecturers</strong>
                <span>Manage classes, assignments & assessments</span>
              </div>

              <div className="about-card-item">
                <strong>Administrators</strong>
                <span>Manage academic activities & reports</span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* How It Works Section */}
      <section className="how-it-works-section">
        <div className="section-heading">
          <p className="section-label">HOW IT WORKS</p>

          <h2>Simple. Organized. Effective.</h2>

          <p>
            Get started with Smart Academic Planner in just a few
            simple steps.
          </p>
        </div>

        <div className="steps-container">

          <div className="step">
            <div className="step-number">01</div>

            <h3>Login</h3>

            <p>
              Sign in to your account and access the features
              available for your role.
            </p>
          </div>

          <div className="step">
            <div className="step-number">02</div>

            <h3>Organize</h3>

            <p>
              Manage your timetable, assignments, tasks,
              assessments, and academic activities.
            </p>
          </div>

          <div className="step">
            <div className="step-number">03</div>

            <h3>Stay on Track</h3>

            <p>
              Receive notifications, monitor your progress,
              and keep up with your academic responsibilities.
            </p>
          </div>

        </div>
      </section>

      {/* Final CTA */}
      <section className="cta-section">
        <div className="cta-content">
          <p className="section-label">GET STARTED</p>

          <h2>Ready to Organize Your Academic Journey?</h2>

          <p>
            Bring your academic activities together and stay
            organized with Smart Academic Planner.
          </p>

          <Link to="/register" className="primary-button">
            Get Started
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <p>
          © 2026 Smart Academic Planner. All rights reserved.
        </p>
      </footer>

    </div>
  );
}

export default Home;