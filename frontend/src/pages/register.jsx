import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

function Register() {
  const [role, setRole] = useState("student");
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    studentId: "",
    level: "",
    classGroup: "",
    lecturerCode: "",
  });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const combinedClassGroup =
      role === "student" ? `${formData.level} - ${formData.classGroup}` : null;

    try {
      await axios.post("http://localhost:5000/api/auth/register", {
        ...formData,
        role,
        classGroup: combinedClassGroup,
      });
      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.error || "Registration failed");
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Create Account</h1>
        <p className="auth-subtitle">Join Smart Academic Planner to get started</p>

        <div className="role-toggle">
          <button
            type="button"
            className={role === "student" ? "active" : ""}
            onClick={() => setRole("student")}
          >
            Student
          </button>
          <button
            type="button"
            className={role === "lecturer" ? "active" : ""}
            onClick={() => setRole("lecturer")}
          >
            Lecturer
          </button>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <input name="firstName" placeholder="First name" onChange={handleChange} required />
          <input name="lastName" placeholder="Last name" onChange={handleChange} required />
          <input name="email" type="email" placeholder="Email" onChange={handleChange} required />
          <input name="phoneNumber" placeholder="Phone number" onChange={handleChange} required />

          {role === "student" && (
            <>
              <input
                name="studentId"
                placeholder="Student ID (e.g. SCT121-C004-0191/2025)"
                onChange={handleChange}
                required
              />
              <select name="level" onChange={handleChange} required defaultValue="">
                <option value="" disabled>Select level of study</option>
                <option value="Certificate">Certificate</option>
                <option value="Diploma">Diploma</option>
                <option value="Undergraduate">Undergraduate (Bachelor's)</option>
                <option value="Masters">Master's</option>
                <option value="PhD">PhD</option>
              </select>
              <input
                name="classGroup"
                placeholder="Class/Year (e.g. Year 2, 2.1, Semester 3)"
                onChange={handleChange}
                required
              />
            </>
          )}

          {role === "lecturer" && (
            <input
              name="lecturerCode"
              placeholder="Lecturer access code"
              onChange={handleChange}
              required
            />
          )}

          {error && <p className="auth-error">{error}</p>}

          <button type="submit" className="auth-submit">Register</button>
        </form>

        <p className="auth-footer-text">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;