import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./app.css";
import Home from "./pages/Home";
import Login from "./pages/login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/forgotpassword";
import ChangePassword from "./pages/ChangePassword";
import Dashboard, { DashboardHome } from "./pages/dashboard";

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
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;