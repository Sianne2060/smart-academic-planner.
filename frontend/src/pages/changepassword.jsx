import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FaEye, FaEyeSlash } from "react-icons/fa";

function ChangePassword() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const [showNewPassword, setShowNewPassword] = useState(false);
const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    const user = JSON.parse(localStorage.getItem("user"));

    try {
      await axios.post("http://localhost:5000/api/auth/change-password", {
        userId: user.id,
        newPassword,
      });

      user.mustChangePassword = false;
      localStorage.setItem("user", JSON.stringify(user));

      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.error || "Failed to change password");
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Change Your Password</h1>
        <p className="auth-subtitle">
          For your security, you must set a new password before continuing.
        </p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="password-field">
  <input
    type={showNewPassword ? "text" : "password"}
    placeholder="New password"
    value={newPassword}
    onChange={(e) => setNewPassword(e.target.value)}
    required
  />
  <button type="button" className="password-toggle" onClick={() => setShowNewPassword(!showNewPassword)}>
    {showNewPassword ? <FaEyeSlash /> : <FaEye />}
  </button>
</div>

<div className="password-field">
  <input
    type={showConfirmPassword ? "text" : "password"}
    placeholder="Confirm new password"
    value={confirmPassword}
    onChange={(e) => setConfirmPassword(e.target.value)}
    required
  />
  <button type="button" className="password-toggle" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
    {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
  </button>
</div>

          {error && <p className="auth-error">{error}</p>}

          <button type="submit" className="auth-submit">Change Password</button>
        </form>
      </div>
    </div>
  );
}

export default ChangePassword;