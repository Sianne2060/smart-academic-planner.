import { useEffect, useState } from "react";
import { Link, Navigate, Outlet } from "react-router-dom";
import axios from "axios";
import {
  FaUserCheck,
  FaUserGraduate,
  FaChalkboardTeacher,
  FaChartBar,
  FaClipboardList,
  FaTrashAlt,
  FaFileUpload,
  FaLayerGroup,
  FaBook,
  FaEdit,
} from "react-icons/fa";

const LEVELS = ["Certificate", "Diploma", "Undergraduate", "Masters", "PhD"];

/* ---------- Helpers shared by all admin pages ---------- */

function adminRequest(method, path, data) {
  const user = JSON.parse(localStorage.getItem("user"));
  return axios({
    method,
    url: `http://localhost:5000/api/admin${path}`,
    data,
    headers: { Authorization: `Bearer ${user?.token}` },
  });
}

function handleError(err) {
  if (err.response?.status === 401) {
    localStorage.removeItem("user");
    window.location.href = "/login";
  }
  return err.response?.data?.error || "Something went wrong";
}

function useAdminData(path, refreshKey) {
  const [state, setState] = useState({ data: null, error: "", loading: true });

  useEffect(() => {
    let cancelled = false;

    adminRequest("get", path)
      .then((res) => {
        if (!cancelled) setState({ data: res.data, error: "", loading: false });
      })
      .catch((err) => {
        if (!cancelled) setState({ data: null, error: handleError(err), loading: false });
      });

    return () => {
      cancelled = true;
    };
  }, [path, refreshKey]);

  return state;
}

function parseCsv(text) {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.split(",").map((cell) => cell.trim().replace(/^"|"$/g, "")))
    .filter((cells, i) => !(i === 0 && cells[0].toLowerCase().includes("id")))
    .map(([studentId, fullName, classGroup]) => ({ studentId, fullName, classGroup }));
}

function BarList({ rows }) {
  const max = Math.max(1, ...rows.map((r) => r.count));

  return rows.map((row) => (
    <div className="bar-row" key={row.label}>
      <div className="bar-top">
        <span>{row.label}</span>
        <strong>{row.count}</strong>
      </div>
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${(row.count / max) * 100}%` }} />
      </div>
    </div>
  ));
}

/* ---------- Only admins can open these pages ---------- */

export function AdminGuard() {
  const user = JSON.parse(localStorage.getItem("user"));

  if (user?.role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}

/* ---------- Admin dashboard home ---------- */

export function AdminHome() {
  const user = JSON.parse(localStorage.getItem("user"));
  const stats = useAdminData("/stats", 0);
  const classes = useAdminData("/classes", 0);
  const units = useAdminData("/units", 0);

  const countFor = (role) => stats.data?.users.find((u) => u.role === role)?.count || 0;
  const totalTasks = stats.data?.tasksByType.reduce((sum, t) => sum + t.count, 0) || 0;
  const error = stats.error || classes.error || units.error;

  const today = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const cards = [
    { label: "Registered Students", value: countFor("student"), icon: FaUserGraduate, color: "purple" },
    { label: "Lecturers", value: countFor("lecturer"), icon: FaChalkboardTeacher, color: "blue" },
    { label: "Pending Approvals", value: stats.data?.pendingStudents || 0, icon: FaUserCheck, color: "orange" },
    { label: "Classes", value: classes.data?.classes.length || 0, icon: FaLayerGroup, color: "pink" },
    { label: "Units", value: units.data?.units.length || 0, icon: FaBook, color: "green" },
    { label: "Tasks Posted", value: totalTasks, icon: FaClipboardList, color: "blue" },
  ];

  const quickLinks = [
    { label: "Approve Students", path: "/approvals", icon: FaUserCheck, color: "orange" },
    { label: "Student Roster", path: "/roster", icon: FaUserGraduate, color: "purple" },
    { label: "Lecturers", path: "/lecturers", icon: FaChalkboardTeacher, color: "blue" },
    { label: "Classes", path: "/manage-classes", icon: FaLayerGroup, color: "pink" },
    { label: "Units", path: "/manage-units", icon: FaBook, color: "green" },
    { label: "Reports", path: "/reports", icon: FaChartBar, color: "orange" },
  ];

  return (
    <div>
      <div className="welcome-banner">
        <div>
          <h1>Welcome back, {user.name.split(" ")[0]}</h1>
          <p>Here's the state of the system.</p>
        </div>
        <span className="banner-date">{today}</span>
      </div>

      {error && <p className="auth-error page-notice">{error}</p>}

      <div className="stats-grid">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div className="stat-card" key={card.label}>
              <div className={`stat-icon icon-${card.color}`}>
                <Icon />
              </div>
              <div className="stat-info">
                <strong>{card.value}</strong>
                <span>{card.label}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="panel">
        <h3>Quick Actions</h3>
        <div className="quick-grid">
          {quickLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link to={link.path} className="quick-card" key={link.path}>
                <div className={`stat-icon icon-${link.color}`}>
                  <Icon />
                </div>
                {link.label}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ---------- Approvals: pending students ---------- */

export function ApprovalsPage() {
  const [refresh, setRefresh] = useState(0);
  const [message, setMessage] = useState("");
  const [actionError, setActionError] = useState("");
  const { data, error, loading } = useAdminData("/pending-students", refresh);

  const decide = async (id, action) => {
    setMessage("");
    setActionError("");

    try {
      const res = await adminRequest("post", `/students/${id}/${action}`);
      setMessage(res.data.message);
      setRefresh((n) => n + 1);
    } catch (err) {
      setActionError(handleError(err));
    }
  };

  const students = data?.students || [];

  return (
    <div>
      <p className="page-subtitle">
        Students who registered with a valid ID are waiting for your approval before they can log in.
      </p>

      {message && <p className="auth-success page-notice">{message}</p>}
      {(error || actionError) && <p className="auth-error page-notice">{error || actionError}</p>}

      <div className="panel">
        <h3>Pending Students ({students.length})</h3>

        {loading && <p className="hint">Loading...</p>}

        {!loading && students.length === 0 && (
          <p className="panel-empty">No students are waiting for approval.</p>
        )}

        {students.length > 0 && (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Student ID</th>
                  <th>Class</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Registered</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s.id}>
                    <td>{s.name}</td>
                    <td>{s.student_id}</td>
                    <td>{s.class_group}</td>
                    <td>{s.email}</td>
                    <td>{s.phone_number}</td>
                    <td>{new Date(s.created_at).toLocaleDateString("en-GB")}</td>
                    <td>
                      <div className="btn-row">
                        <button className="btn btn-success" onClick={() => decide(s.id, "approve")}>
                          Approve
                        </button>
                        <button className="btn btn-danger" onClick={() => decide(s.id, "reject")}>
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------- Student roster ---------- */

export function RosterPage() {
  const [refresh, setRefresh] = useState(0);
  const [form, setForm] = useState({ studentId: "", fullName: "", classGroup: "" });
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [actionError, setActionError] = useState("");
  const { data, error, loading } = useAdminData("/roster", refresh);
  const classes = useAdminData("/classes", refresh);

  const classList = classes.data?.classes || [];

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const addStudent = async (e) => {
    e.preventDefault();
    setMessage("");
    setActionError("");

    try {
      await adminRequest("post", "/roster", form);
      setMessage("Student added to the roster.");
      setForm({ ...form, studentId: "", fullName: "" });
      setRefresh((n) => n + 1);
    } catch (err) {
      setActionError(handleError(err));
    }
  };

  const importCsv = async (e) => {
    const file = e.target.files[0];
    e.target.value = "";
    if (!file) return;

    setMessage("");
    setActionError("");

    try {
      const students = parseCsv(await file.text());
      const res = await adminRequest("post", "/roster/import", { students });

      let text = `Imported ${res.data.added} student(s). Skipped ${res.data.skipped} (duplicates, incomplete rows or unknown classes).`;
      if (res.data.unknownClasses?.length) {
        text += ` These classes don't exist yet: ${res.data.unknownClasses.join(", ")}. Create them under Classes first.`;
      }

      setMessage(text);
      setRefresh((n) => n + 1);
    } catch (err) {
      setActionError(handleError(err));
    }
  };

  const removeStudent = async (student) => {
    if (!window.confirm(`Remove ${student.full_name} from the roster?`)) return;

    setMessage("");
    setActionError("");

    try {
      await adminRequest("delete", `/roster/${student.id}`);
      setMessage("Removed from the roster.");
      setRefresh((n) => n + 1);
    } catch (err) {
      setActionError(handleError(err));
    }
  };

  const students = (data?.students || []).filter((s) =>
    `${s.student_id} ${s.full_name} ${s.class_group}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="panel-stack">
      <p className="page-subtitle">
        Only students on this list can register. Their class comes from here.
      </p>

      {message && <p className="auth-success">{message}</p>}
      {(error || actionError) && <p className="auth-error">{error || actionError}</p>}

      <div className="panel">
        <h3>Add a Student</h3>

        {classList.length === 0 && (
          <p className="hint">No classes yet. Create one under Classes before adding students.</p>
        )}

        <form onSubmit={addStudent}>
          <div className="form-grid">
            <input
              name="studentId"
              placeholder="Student ID"
              value={form.studentId}
              onChange={handleChange}
              required
            />
            <input
              name="fullName"
              placeholder="Full name"
              value={form.fullName}
              onChange={handleChange}
              required
            />
            <select name="classGroup" value={form.classGroup} onChange={handleChange} required>
              <option value="" disabled>
                Select class
              </option>
              {classList.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" className="btn btn-primary">
            Add Student
          </button>
        </form>
      </div>

      <div className="panel">
        <h3>Import from CSV</h3>
        <label className="btn btn-secondary file-label">
          <FaFileUpload /> Choose CSV file
          <input type="file" accept=".csv,text/csv" hidden onChange={importCsv} />
        </label>
        <p className="hint">
          Each line: student ID, full name, class. For example:
          SCT121-C004-0194/2025, Jane Wanjiku, Diploma - 2.1. The class must already exist under
          Classes. A header row is fine, and duplicates are skipped.
        </p>
      </div>

      <div className="panel">
        <div className="toolbar">
          <h3>Roster ({data?.students.length || 0})</h3>
          <input
            className="search-input"
            placeholder="Search by ID, name or class"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {loading && <p className="hint">Loading...</p>}

        {!loading && students.length === 0 && <p className="panel-empty">No students found.</p>}

        {students.length > 0 && (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Student ID</th>
                  <th>Name</th>
                  <th>Class</th>
                  <th>Account</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s.id}>
                    <td>{s.student_id}</td>
                    <td>{s.full_name}</td>
                    <td>{s.class_group}</td>
                    <td>
                      {s.registered ? (
                        <span className="badge badge-green">Registered</span>
                      ) : (
                        <span className="badge badge-gray">Not yet</span>
                      )}
                    </td>
                    <td>
                      <button className="btn btn-danger" onClick={() => removeStudent(s)}>
                        <FaTrashAlt /> Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------- Lecturers ---------- */

export function LecturersPage() {
  const [refresh, setRefresh] = useState(0);
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", phoneNumber: "" });
  const [message, setMessage] = useState("");
  const [actionError, setActionError] = useState("");
  const { data, error, loading } = useAdminData("/lecturers", refresh);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const addLecturer = async (e) => {
    e.preventDefault();
    setMessage("");
    setActionError("");

    try {
      const res = await adminRequest("post", "/lecturers", form);
      setMessage(res.data.message);
      setForm({ firstName: "", lastName: "", email: "", phoneNumber: "" });
      setRefresh((n) => n + 1);
    } catch (err) {
      setActionError(handleError(err));
    }
  };

  const lecturers = data?.lecturers || [];

  return (
    <div className="panel-stack">
      <p className="page-subtitle">
        Lecturers don't register themselves. You create their account and they receive a temporary
        password by email.
      </p>

      {message && <p className="auth-success">{message}</p>}
      {(error || actionError) && <p className="auth-error">{error || actionError}</p>}

      <div className="panel">
        <h3>Add a Lecturer</h3>
        <form onSubmit={addLecturer}>
          <div className="form-grid">
            <input
              name="firstName"
              placeholder="First name"
              value={form.firstName}
              onChange={handleChange}
              required
            />
            <input
              name="lastName"
              placeholder="Last name"
              value={form.lastName}
              onChange={handleChange}
              required
            />
            <input
              name="email"
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={handleChange}
              required
            />
            <input
              name="phoneNumber"
              placeholder="Phone number"
              value={form.phoneNumber}
              onChange={handleChange}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary">
            Create Lecturer Account
          </button>
        </form>
      </div>

      <div className="panel">
        <h3>Lecturers ({lecturers.length})</h3>

        {loading && <p className="hint">Loading...</p>}

        {!loading && lecturers.length === 0 && <p className="panel-empty">No lecturers yet.</p>}

        {lecturers.length > 0 && (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Added</th>
                </tr>
              </thead>
              <tbody>
                {lecturers.map((l) => (
                  <tr key={l.id}>
                    <td>{l.name}</td>
                    <td>{l.email}</td>
                    <td>{l.phone_number}</td>
                    <td>{new Date(l.created_at).toLocaleDateString("en-GB")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------- Classes ---------- */

export function ClassesPage() {
  const [refresh, setRefresh] = useState(0);
  const [form, setForm] = useState({ level: "Diploma", classYear: "", programme: "" });
  const [editing, setEditing] = useState(null);
  const [message, setMessage] = useState("");
  const [actionError, setActionError] = useState("");
  const { data, error, loading } = useAdminData("/classes", refresh);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const addClass = async (e) => {
    e.preventDefault();
    setMessage("");
    setActionError("");

    try {
      await adminRequest("post", "/classes", {
        name: `${form.level} - ${form.classYear.trim()}`,
        programme: form.programme,
      });
      setMessage("Class created.");
      setForm({ ...form, classYear: "", programme: "" });
      setRefresh((n) => n + 1);
    } catch (err) {
      setActionError(handleError(err));
    }
  };

  const saveEdit = async () => {
    setMessage("");
    setActionError("");

    try {
      await adminRequest("put", `/classes/${editing.id}`, {
        name: editing.name,
        programme: editing.programme,
      });
      setEditing(null);
      setMessage("Class updated. Students and units in it follow the new name.");
      setRefresh((n) => n + 1);
    } catch (err) {
      setActionError(handleError(err));
    }
  };

  const removeClass = async (c) => {
    if (!window.confirm(`Delete the class ${c.name}? Its unit assignments will be removed too.`)) {
      return;
    }

    setMessage("");
    setActionError("");

    try {
      await adminRequest("delete", `/classes/${c.id}`);
      setMessage("Class deleted.");
      setRefresh((n) => n + 1);
    } catch (err) {
      setActionError(handleError(err));
    }
  };

  const classes = data?.classes || [];

  return (
    <div className="panel-stack">
      <p className="page-subtitle">
        Classes group students together and are what units are assigned to. Students get their class
        from the roster.
      </p>

      {message && <p className="auth-success">{message}</p>}
      {(error || actionError) && <p className="auth-error">{error || actionError}</p>}

      <div className="panel">
        <h3>Create a Class</h3>
        <form onSubmit={addClass}>
          <div className="form-grid">
            <select name="level" value={form.level} onChange={handleChange}>
              {LEVELS.map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>
            <input
              name="classYear"
              placeholder="Class/Year (e.g. 2.1)"
              value={form.classYear}
              onChange={handleChange}
              required
            />
            <input
              name="programme"
              placeholder="Programme (optional)"
              value={form.programme}
              onChange={handleChange}
            />
          </div>
          <button type="submit" className="btn btn-primary">
            Create Class
          </button>
        </form>
      </div>

      <div className="panel">
        <h3>Classes ({classes.length})</h3>

        {loading && <p className="hint">Loading...</p>}

        {!loading && classes.length === 0 && <p className="panel-empty">No classes yet.</p>}

        {classes.length > 0 && (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Class</th>
                  <th>Programme</th>
                  <th>Students</th>
                  <th>Units</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {classes.map((c) =>
                  editing?.id === c.id ? (
                    <tr key={c.id}>
                      <td>
                        <input
                          className="inline-input"
                          value={editing.name}
                          onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                        />
                      </td>
                      <td>
                        <input
                          className="inline-input"
                          value={editing.programme}
                          onChange={(e) => setEditing({ ...editing, programme: e.target.value })}
                        />
                      </td>
                      <td>{c.students}</td>
                      <td>{c.units}</td>
                      <td>
                        <div className="btn-row">
                          <button className="btn btn-success" onClick={saveEdit}>
                            Save
                          </button>
                          <button className="btn btn-ghost" onClick={() => setEditing(null)}>
                            Cancel
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    <tr key={c.id}>
                      <td>{c.name}</td>
                      <td>{c.programme || "-"}</td>
                      <td>{c.students}</td>
                      <td>{c.units}</td>
                      <td>
                        <div className="btn-row">
                          <button
                            className="btn btn-secondary"
                            onClick={() =>
                              setEditing({ id: c.id, name: c.name, programme: c.programme || "" })
                            }
                          >
                            <FaEdit /> Edit
                          </button>
                          <button className="btn btn-danger" onClick={() => removeClass(c)}>
                            <FaTrashAlt /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------- Units, and which classes take them ---------- */

export function UnitsPage() {
  const [refresh, setRefresh] = useState(0);
  const [unitForm, setUnitForm] = useState({ code: "", name: "" });
  const [editing, setEditing] = useState(null);
  const [assignForm, setAssignForm] = useState({ className: "", unitId: "", lecturerId: "" });
  const [filterClass, setFilterClass] = useState("");
  const [message, setMessage] = useState("");
  const [actionError, setActionError] = useState("");

  const units = useAdminData("/units", refresh);
  const classes = useAdminData("/classes", refresh);
  const lecturers = useAdminData("/lecturers", refresh);
  const assignments = useAdminData("/class-units", refresh);

  const loadError = units.error || classes.error || lecturers.error || assignments.error;
  const unitList = units.data?.units || [];
  const classList = classes.data?.classes || [];
  const lecturerList = lecturers.data?.lecturers || [];
  const visibleAssignments = (assignments.data?.assignments || []).filter(
    (a) => !filterClass || a.class_name === filterClass
  );

  const reload = () => setRefresh((n) => n + 1);

  const run = async (action, successText) => {
    setMessage("");
    setActionError("");

    try {
      await action();
      if (successText) setMessage(successText);
      reload();
      return true;
    } catch (err) {
      setActionError(handleError(err));
      return false;
    }
  };

  const addUnit = async (e) => {
    e.preventDefault();
    const ok = await run(() => adminRequest("post", "/units", unitForm), "Unit created.");
    if (ok) setUnitForm({ code: "", name: "" });
  };

  const saveUnit = async () => {
    const ok = await run(
      () => adminRequest("put", `/units/${editing.id}`, { code: editing.code, name: editing.name }),
      "Unit updated."
    );
    if (ok) setEditing(null);
  };

  const removeUnit = async (unit) => {
    if (!window.confirm(`Delete ${unit.code}? It will also be removed from every class.`)) return;
    await run(() => adminRequest("delete", `/units/${unit.id}`), "Unit deleted.");
  };

  const assignUnit = async (e) => {
    e.preventDefault();
    const ok = await run(
      () => adminRequest("post", "/class-units", assignForm),
      "Unit added to the class."
    );
    if (ok) setAssignForm({ ...assignForm, unitId: "", lecturerId: "" });
  };

  const changeLecturer = (assignmentId, lecturerId) =>
    run(() => adminRequest("put", `/class-units/${assignmentId}`, { lecturerId }), "Lecturer updated.");

  const removeAssignment = async (a) => {
    if (!window.confirm(`Remove ${a.code} from ${a.class_name}?`)) return;
    await run(() => adminRequest("delete", `/class-units/${a.id}`), "Unit removed from the class.");
  };

  return (
    <div className="panel-stack">
      <p className="page-subtitle">
        Add your units, then assign each one to the classes that take it and choose the lecturer who
        teaches it.
      </p>

      {message && <p className="auth-success">{message}</p>}
      {(loadError || actionError) && <p className="auth-error">{loadError || actionError}</p>}

      <div className="panel">
        <h3>Add a Unit</h3>
        <form onSubmit={addUnit}>
          <div className="form-grid">
            <input
              placeholder="Unit code (e.g. DIT 0301)"
              value={unitForm.code}
              onChange={(e) => setUnitForm({ ...unitForm, code: e.target.value })}
              required
            />
            <input
              placeholder="Unit name"
              value={unitForm.name}
              onChange={(e) => setUnitForm({ ...unitForm, name: e.target.value })}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary">
            Add Unit
          </button>
        </form>
      </div>

      <div className="panel">
        <h3>Units ({unitList.length})</h3>

        {units.loading && <p className="hint">Loading...</p>}

        {!units.loading && unitList.length === 0 && <p className="panel-empty">No units yet.</p>}

        {unitList.length > 0 && (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Name</th>
                  <th>Classes</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {unitList.map((u) =>
                  editing?.id === u.id ? (
                    <tr key={u.id}>
                      <td>
                        <input
                          className="inline-input"
                          value={editing.code}
                          onChange={(e) => setEditing({ ...editing, code: e.target.value })}
                        />
                      </td>
                      <td>
                        <input
                          className="inline-input"
                          value={editing.name}
                          onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                        />
                      </td>
                      <td>{u.classes}</td>
                      <td>
                        <div className="btn-row">
                          <button className="btn btn-success" onClick={saveUnit}>
                            Save
                          </button>
                          <button className="btn btn-ghost" onClick={() => setEditing(null)}>
                            Cancel
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    <tr key={u.id}>
                      <td>{u.code}</td>
                      <td>{u.name}</td>
                      <td>{u.classes}</td>
                      <td>
                        <div className="btn-row">
                          <button
                            className="btn btn-secondary"
                            onClick={() => setEditing({ id: u.id, code: u.code, name: u.name })}
                          >
                            <FaEdit /> Edit
                          </button>
                          <button className="btn btn-danger" onClick={() => removeUnit(u)}>
                            <FaTrashAlt /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="panel">
        <h3>Assign a Unit to a Class</h3>

        {(classList.length === 0 || unitList.length === 0) && (
          <p className="hint">You need at least one class and one unit before you can assign.</p>
        )}

        <form onSubmit={assignUnit}>
          <div className="form-grid">
            <select
              value={assignForm.className}
              onChange={(e) => setAssignForm({ ...assignForm, className: e.target.value })}
              required
            >
              <option value="" disabled>
                Select class
              </option>
              {classList.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>

            <select
              value={assignForm.unitId}
              onChange={(e) => setAssignForm({ ...assignForm, unitId: e.target.value })}
              required
            >
              <option value="" disabled>
                Select unit
              </option>
              {unitList.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.code} - {u.name}
                </option>
              ))}
            </select>

            <select
              value={assignForm.lecturerId}
              onChange={(e) => setAssignForm({ ...assignForm, lecturerId: e.target.value })}
            >
              <option value="">Lecturer (assign later)</option>
              {lecturerList.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" className="btn btn-primary">
            Assign Unit
          </button>
        </form>
      </div>

      <div className="panel">
        <div className="toolbar">
          <h3>Units in Classes ({visibleAssignments.length})</h3>
          <select
            className="search-input"
            value={filterClass}
            onChange={(e) => setFilterClass(e.target.value)}
          >
            <option value="">All classes</option>
            {classList.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {assignments.loading && <p className="hint">Loading...</p>}

        {!assignments.loading && visibleAssignments.length === 0 && (
          <p className="panel-empty">No units have been assigned to classes yet.</p>
        )}

        {visibleAssignments.length > 0 && (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Class</th>
                  <th>Unit</th>
                  <th>Lecturer</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {visibleAssignments.map((a) => (
                  <tr key={a.id}>
                    <td>{a.class_name}</td>
                    <td>
                      {a.code} - {a.unit_name}
                    </td>
                    <td>
                      <select
                        className="inline-input"
                        value={a.lecturer_id || ""}
                        onChange={(e) => changeLecturer(a.id, e.target.value)}
                      >
                        <option value="">Unassigned</option>
                        {lecturerList.map((l) => (
                          <option key={l.id} value={l.id}>
                            {l.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <button className="btn btn-danger" onClick={() => removeAssignment(a)}>
                        <FaTrashAlt /> Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------- Reports ---------- */

export function ReportsPage() {
  const { data, error, loading } = useAdminData("/stats", 0);

  const roleLabels = { student: "Students", lecturer: "Lecturers", admin: "Administrators" };
  const typeLabels = { assignment: "Assignments", CAT: "CATs", exam: "Exams", task: "Tasks" };

  const userRows = (data?.users || []).map((u) => ({
    label: roleLabels[u.role] || u.role,
    count: u.count,
  }));
  const classRows = (data?.studentsByClass || []).map((c) => ({
    label: c.class_group,
    count: c.count,
  }));
  const taskRows = (data?.tasksByType || []).map((t) => ({
    label: typeLabels[t.type] || t.type,
    count: t.count,
  }));

  return (
    <div className="panel-stack">
      <p className="page-subtitle">A summary of everything in the system.</p>

      {error && <p className="auth-error">{error}</p>}
      {loading && <p className="hint">Loading reports...</p>}

      <div className="panel">
        <h3>Users by Role</h3>
        {userRows.length === 0 ? <p className="panel-empty">No users yet.</p> : <BarList rows={userRows} />}
        <p className="hint">Students waiting for approval: {data?.pendingStudents || 0}</p>
      </div>

      <div className="panel">
        <h3>Approved Students per Class</h3>
        {classRows.length === 0 ? (
          <p className="panel-empty">No approved students yet.</p>
        ) : (
          <BarList rows={classRows} />
        )}
      </div>

      <div className="panel">
        <h3>Tasks by Type</h3>
        {taskRows.length === 0 ? (
          <p className="panel-empty">No tasks have been posted yet.</p>
        ) : (
          <BarList rows={taskRows} />
        )}
      </div>
    </div>
  );
}