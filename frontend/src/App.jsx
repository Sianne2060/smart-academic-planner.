import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./app.css";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/register";
import ForgotPassword from "./pages/ForgotPassword";
import ChangePassword from "./pages/changepassword";
import Dashboard, { DashboardHome } from "./pages/dashboard";
import {
  AdminGuard,
  ApprovalsPage,
  RosterPage,
  LecturersPage,
  ClassesPage,
  UnitsPage,
  ReportsPage,
} from "./pages/Admin";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/change-password" element={<ChangePassword />} />

        <Route element={<Dashboard />}>
          <Route path="/dashboard" element={<DashboardHome />} />
          <Route path="/classes" element={<h1 className="page-title">Classes</h1>} />
          <Route path="/assignments" element={<h1 className="page-title">Assignments</h1>} />
          <Route path="/my-units" element={<h1 className="page-title">My Units</h1>} />
          <Route path="/assessments" element={<h1 className="page-title">Assessments</h1>} />
          <Route path="/tasks" element={<h1 className="page-title">Tasks</h1>} />
          <Route path="/notifications" element={<h1 className="page-title">Notifications</h1>} />
          <Route path="/settings" element={<h1 className="page-title">Settings</h1>} />

          <Route element={<AdminGuard />}>
  <Route path="/approvals" element={<ApprovalsPage />} />
  <Route path="/roster" element={<RosterPage />} />
  <Route path="/lecturers" element={<LecturersPage />} />
  <Route path="/manage-classes" element={<ClassesPage />} />
  <Route path="/manage-units" element={<UnitsPage />} />
  <Route path="/reports" element={<ReportsPage />} />
</Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;