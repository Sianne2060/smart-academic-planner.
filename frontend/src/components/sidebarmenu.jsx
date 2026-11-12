import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  FaThLarge,
  FaChalkboardTeacher,
  FaClipboardList,
  FaBook,
  FaFileAlt,
  FaBell,
  FaCog,
  FaTasks,
  FaSignOutAlt,
  FaGraduationCap,
  FaRegClock,
  FaUserCheck,
  FaUserGraduate,
  FaChartBar,
  FaLayerGroup,
} from "react-icons/fa";

const menuItems = {
  student: [
    { label: "Dashboard", path: "/dashboard", icon: FaThLarge },
    { label: "Assignments", path: "/assignments", icon: FaClipboardList },
    { label: "Tasks", path: "/tasks", icon: FaTasks },
    { label: "Assessments", path: "/assessments", icon: FaFileAlt },
    { label: "Notifications", path: "/notifications", icon: FaBell },
    { label: "Settings", path: "/settings", icon: FaCog },
  ],

  lecturer: [
    { label: "Dashboard", path: "/dashboard", icon: FaThLarge },
    { label: "Classes", path: "/classes", icon: FaChalkboardTeacher },
    { label: "Assignments", path: "/assignments", icon: FaClipboardList },
    { label: "My Units", path: "/my-units", icon: FaBook },
    { label: "Assessments", path: "/assessments", icon: FaFileAlt },
    { label: "Notifications", path: "/notifications", icon: FaBell },
    { label: "Settings", path: "/settings", icon: FaCog },
  ],

  admin: [
    { label: "Dashboard", path: "/dashboard", icon: FaThLarge },
    { label: "Approvals", path: "/approvals", icon: FaUserCheck },
    { label: "Student Roster", path: "/roster", icon: FaUserGraduate },
    { label: "Lecturers", path: "/lecturers", icon: FaChalkboardTeacher },
    { label: "Classes", path: "/manage-classes", icon: FaLayerGroup },
    { label: "Units", path: "/manage-units", icon: FaBook },
    { label: "Reports", path: "/reports", icon: FaChartBar },
    { label: "Settings", path: "/settings", icon: FaCog },
  ],
};

function Sidebarmenu({ role }) {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <aside className="sidebar">
      <div>
        <div className="sidebar-brand">
          <div className="brand-icon">
            <FaGraduationCap />
          </div>
          <h2>Smart Academic Planner</h2>
        </div>

        <p className="sidebar-label">Menu</p>

        <nav>
          <ul>
            {menuItems[role]?.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={location.pathname === item.path ? "active-link" : ""}
                  >
                    <Icon />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      <div>
        {role !== "admin" && (
          <div className="next-deadline">
            <div className="next-icon">
              <FaRegClock />
            </div>
            <div>
              <p className="next-title">Next deadline</p>
              <p className="next-text">Nothing due yet</p>
            </div>
          </div>
        )}

        <button className="logout-button" onClick={handleLogout}>
          <FaSignOutAlt />
          Log Out
        </button>
      </div>
    </aside>
  );
}

export default Sidebarmenu;