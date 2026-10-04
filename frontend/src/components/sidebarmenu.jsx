const userRole = "lecturer";

const menuItems = {
  student: [
    "Dashboard",
    "Timetable",
    "Assignments",
    "Tasks",
    "Assessments",
    "Notifications",
    "Performance",
    "Profile",
  ],

  lecturer: [
    "Dashboard",
    "My Classes",
    "My Units",
    "Assignments",
    "Assessments",
    "Student Performance",
    "Notifications",
    "Profile",
  ],

  admin: [
    "Dashboard",
    "Schools",
    "Classes",
    "Units",
    "Students",
    "Lecturers",
    "Timetable",
    "Assessments",
    "Reports",
    "Notifications",
    "Settings",
  ],
};

function Sidebarmenu() {
  return (
    <aside className="sidebar">
      <h2>Smart Academic Planner</h2>

      <p>Logged in as: {userRole}</p>

      <nav>
        <ul>
          {menuItems[userRole].map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}

export default Sidebarmenu;