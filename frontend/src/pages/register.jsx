import { useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

function Register() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    studentId: "",
  });
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await axios.post("http://localhost:5000/api/auth/register", formData);
      setSuccessMessage(res.data.message);
    } catch (err) {
      setError(err.response?.data?.error || "Registration failed");
    }
  };

  if (successMessage) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <h1>You're Registered</h1>
          <p className="auth-subtitle">{successMessage}</p>
          <Link to="/login" className="auth-submit auth-link-button">
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Student Registration</h1>
        <p className="auth-subtitle">
          Register with your student ID. The administrator will approve your account.
        </p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <input name="firstName" placeholder="First name" onChange={handleChange} required />
          <input name="lastName" placeholder="Last name" onChange={handleChange} required />
          <input name="email" type="email" placeholder="Email" onChange={handleChange} required />
          <input name="phoneNumber" placeholder="Phone number" onChange={handleChange} required />
          <input name="studentId" placeholder="Student ID" onChange={handleChange} required />

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