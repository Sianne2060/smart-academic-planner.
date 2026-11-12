import { useState } from "react";
import { Link, Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  FaBell,
  FaChevronDown,
  FaUserEdit,
  FaSignOutAlt,
  FaArrowLeft,
  FaClipboardList,
  FaFileAlt,
  FaTasks,
  FaChalkboardTeacher,
  FaBook,
  FaHourglassHalf,
  FaCalendarAlt,
  FaRegCircle,
  FaCheckCircle,
} from "react-icons/fa";
import Sidebarmenu from "../components/sidebarmenu";
import { AdminHome } from "./Admin";

// Set to false to hide the made-up sample content and show empty states instead
const SHOW_SAMPLE_DATA = true;

const statsByRole = {
  student: [
    { label: "Upcoming Assignments", icon: FaClipboardList, color: "purple", sample: 4 },
    { label: "Upcoming CATs", icon: FaFileAlt, color: "orange", sample: 2 },
    { label: "Tasks Due Soon", icon: FaTasks, color: "blue", sample: 3 },
    { label: "Unread Notifications", icon: FaBell, color: "green", sample: 5 },
  ],
  lecturer: [
    { label: "Classes You Teach", icon: FaChalkboardTeacher, color: "purple", sample: 3 },
    { label: "Units You Teach", icon: FaBook, color: "blue", sample: 5 },
    { label: "Upcoming Assignments", icon: FaClipboardList, color: "orange", sample: 4 },
    { label: "Upcoming CATs", icon: FaFileAlt, color: "pink", sample: 2 },
    { label: "Pending Submissions", icon: FaHourglassHalf, color: "green", sample: 14 },
  ],
};

const sampleData = {
  lecturer: {
    deadlines: [
      { title: "Database Systems Assignment 2", meta: "Diploma - 2.1 · Fri, 23 Oct", tag: "Assignment" },
      { title: "Web Development CAT 1", meta: "Diploma - 2.2 · Tue, 27 Oct", tag: "CAT" },
      { title: "Networking Exam", meta: "Diploma - 2.1 · Fri, 30 Oct", tag: "Exam" },
    ],
    items: [
      { title: "Database Systems Assignment 2", done: 18, total: 32 },
      { title: "Web Development Assignment 1", done: 30, total: 32 },
      { title: "Systems Analysis Assignment 3", done: 9, total: 28 },
    ],
    notifications: [
      { text: "18 students have submitted Database Systems Assignment 2", time: "2 hours ago" },
      { text: "Web Development CAT 1 is due in 5 days", time: "Yesterday" },
      { text: "Networking Exam date confirmed", time: "2 days ago" },
    ],
    classes: ["Diploma - 2.1", "Diploma - 2.2", "Certificate - Year 1"],
    markedDays: [23, 27, 30],
  },
  student: {
    deadlines: [
      { title: "Database Systems Assignment 2", meta: "Diploma - 2.1 · Fri, 23 Oct", tag: "Assignment" },
      { title: "Web Development CAT 1", meta: "Diploma - 2.1 · Tue, 27 Oct", tag: "CAT" },
      { title: "Networking Exam", meta: "Diploma - 2.1 · Fri, 30 Oct", tag: "Exam" },
    ],
    items: [
      { title: "Finish Database Assignment 2", meta: "Due Fri, 23 Oct", done: false },
      { title: "Revise for Web Development CAT 1", meta: "Due Tue, 27 Oct", done: false },
      { title: "Read Chapter 4 - Networking", meta: "Due Wed, 28 Oct", done: true },
    ],
    notifications: [
      { text: "New assignment posted: Database Systems Assignment 2", time: "2 hours ago" },
      { text: "Web Development CAT 1 is due in 5 days", time: "Yesterday" },
      { text: "Networking Exam date confirmed", time: "2 days ago" },
    ],
    classes: [],
    markedDays: [23, 27, 30],
  },
};

const emptyData = { deadlines: [], items: [], notifications: [], classes: [], markedDays: [] };

function EmptyState({ icon: Icon, text }) {
  return (
    <div className="empty-state">
      <div className="empty-icon">
        <Icon />
      </div>
      <p>{text}</p>
    </div>
  );
}

function MiniCalendar({ markedDays }) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const monthName = now.toLocaleDateString("en-GB", { month: "long", year: "numeric" });

  return (
    <div>
      <p className="calendar-month">{monthName}</p>
      <div className="calendar-grid">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <span key={i} className="calendar-dow">{d}</span>
        ))}
        {cells.map((day, i) => (
          <span
            key={i}
            className={`calendar-day ${day === now.getDate() ? "today" : ""} ${
              markedDays.includes(day) ? "marked" : ""
            }`}
          >
            {day}
          </span>
        ))}
      </div>
    </div>
  );
}

function Dashboard() {
  const user = JSON.parse(localStorage.getItem("user"));
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const isHome = location.pathname === "/dashboard";

  const initials = user.name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const pageName = location.pathname.slice(1).replace("-", " ");

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <div className="dashboard-layout">
      {isHome && <Sidebarmenu role={user.role} />}

      <div className="dashboard-body">
        <header className="topbar">
          {isHome ? (
            <h2 className="topbar-title">Dashboard</h2>
          ) : (
            <div className="topbar-left">
              <button className="back-button" onClick={() => navigate("/dashboard")}>
                <FaArrowLeft /> Back to Dashboard
              </button>
              <h2 className="topbar-title">{pageName}</h2>
            </div>
          )}

          {isHome && (
            <div className="topbar-actions">
              {user.role !== "admin" && (
                <button
                  className="icon-button"
                  onClick={() => navigate("/notifications")}
                  aria-label="Notifications"
                >
                  <FaBell />
                  {SHOW_SAMPLE_DATA && <span className="bell-badge">3</span>}
                </button>
              )}

              <div className="profile-wrapper">
                <button className="profile-button" onClick={() => setMenuOpen(!menuOpen)}>
                  <span className="profile-avatar">{initials}</span>
                  <FaChevronDown className="profile-chevron" />
                </button>

                {menuOpen && (
                  <div className="profile-menu">
                    <div className="profile-menu-header">
                      <strong>{user.name}</strong>
                      <span>{user.email}</span>
                    </div>
                    <Link to="/settings" onClick={() => setMenuOpen(false)}>
                      <FaUserEdit /> Edit Profile
                    </Link>
                    <button onClick={handleLogout}>
                      <FaSignOutAlt /> Log Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </header>

        <main className="dashboard-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export function DashboardHome() {
  const user = JSON.parse(localStorage.getItem("user"));

  if (user.role === "admin") {
    return <AdminHome />;
  }

  const firstName = user.name.split(" ")[0];
  const data = SHOW_SAMPLE_DATA ? sampleData[user.role] : emptyData;
  const isLecturer = user.role === "lecturer";

  const today = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div>
      <div className="welcome-banner">
        <div>
          <h1>Welcome back, {firstName}</h1>
          <p>
            {isLecturer
              ? "Here's what's happening across your classes."
              : "Here's what's coming up for you."}
          </p>
        </div>
        <span className="banner-date">{today}</span>
      </div>

      <div className="stats-grid">
        {statsByRole[user.role]?.map((stat) => {
          const Icon = stat.icon;
          return (
            <div className="stat-card" key={stat.label}>
              <div className={`stat-icon icon-${stat.color}`}>
                <Icon />
              </div>
              <div className="stat-info">
                <strong>{SHOW_SAMPLE_DATA ? stat.sample : 0}</strong>
                <span>{stat.label}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="content-grid">
        <div className="content-col">
          <div className="panel">
            <h3>Upcoming Deadlines</h3>
            {data.deadlines.length === 0 ? (
              <EmptyState icon={FaCalendarAlt} text="No upcoming deadlines yet." />
            ) : (
              data.deadlines.map((item) => (
                <div className="list-item" key={item.title}>
                  <div>
                    <p className="list-title">{item.title}</p>
                    <p className="list-meta">{item.meta}</p>
                  </div>
                  <span className={`tag tag-${item.tag.toLowerCase()}`}>{item.tag}</span>
                </div>
              ))
            )}
          </div>

          <div className="panel">
            <h3>{isLecturer ? "Submission Progress" : "My Tasks"}</h3>
            {data.items.length === 0 ? (
              <EmptyState
                icon={isLecturer ? FaHourglassHalf : FaTasks}
                text={isLecturer ? "No submissions to track yet." : "No tasks yet."}
              />
            ) : isLecturer ? (
              data.items.map((item) => (
                <div className="progress-item" key={item.title}>
                  <div className="progress-top">
                    <p className="list-title">{item.title}</p>
                    <span className="list-meta">
                      {item.done}/{item.total} submitted
                    </span>
                  </div>
                  <div className="progress-track">
                    <div
                      className="progress-fill"
                      style={{ width: `${(item.done / item.total) * 100}%` }}
                    />
                  </div>
                </div>
              ))
            ) : (
              data.items.map((item) => (
                <div className="task-item" key={item.title}>
                  <span className={item.done ? "task-check done" : "task-check"}>
                    {item.done ? <FaCheckCircle /> : <FaRegCircle />}
                  </span>
                  <div>
                    <p className={item.done ? "list-title struck" : "list-title"}>{item.title}</p>
                    <p className="list-meta">{item.meta}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="content-col">
          <div className="panel">
            <h3>Calendar</h3>
            <MiniCalendar markedDays={data.markedDays} />
          </div>

          <div className="panel">
            <h3>Recent Notifications</h3>
            {data.notifications.length === 0 ? (
              <EmptyState icon={FaBell} text="You're all caught up." />
            ) : (
              data.notifications.map((item) => (
                <div className="notification-item" key={item.text}>
                  <span className="notification-dot" />
                  <div>
                    <p className="list-title">{item.text}</p>
                    <p className="list-meta">{item.time}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          {isLecturer && (
            <div className="panel">
              <h3>Your Classes</h3>
              {data.classes.length === 0 ? (
                <EmptyState icon={FaChalkboardTeacher} text="No classes yet." />
              ) : (
                <div className="chip-row">
                  {data.classes.map((c) => (
                    <span className="chip" key={c}>{c}</span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;