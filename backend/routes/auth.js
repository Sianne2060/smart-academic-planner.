const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const pool = require('../config/db');
const jwt = require('jsonwebtoken');
const { requireAuth } = require('../middleware/auth');


const crypto = require('crypto');
const transporter = require('../config/mailer');

function generateTempPassword() {
  return crypto.randomBytes(6).toString('hex'); // e.g. "a1b2c3d4e5f6"
}

router.post('/register', async (req, res) => {
  const { firstName, lastName, email, phoneNumber, studentId } = req.body;

  if (!firstName || !lastName || !email || !phoneNumber || !studentId) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  const cleanStudentId = studentId.trim().toUpperCase();

  try {
    const roster = await pool.query(
      'SELECT class_group FROM student_roster WHERE student_id = $1',
      [cleanStudentId]
    );

    if (roster.rows.length === 0) {
      return res.status(403).json({
        error: "This student ID is not on the school's records. Please contact the administrator.",
      });
    }

    const classGroup = roster.rows[0].class_group;
    const tempPassword = generateTempPassword();
    const hashedPassword = await bcrypt.hash(tempPassword, 10);
    const fullName = `${firstName.trim()} ${lastName.trim()}`;

    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash, role, phone_number, student_id, class_group, must_change_password, approval_status)
       VALUES ($1, $2, $3, 'student', $4, $5, $6, TRUE, 'pending')
       RETURNING id, name, email, role`,
      [fullName, email.trim(), hashedPassword, phoneNumber.trim(), cleanStudentId, classGroup]
    );

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email.trim(),
      subject: 'Your Smart Academic Planner Account',
      text: `Hello ${firstName.trim()},\n\nYour registration has been received.\n\nTemporary password: ${tempPassword}\n\nYour account is awaiting approval by the administrator. You will be able to log in once it is approved, and we will email you when that happens.`,
    });

    res.status(201).json({
      user: result.rows[0],
      pendingApproval: true,
      message:
        'Registration received. Your account is awaiting administrator approval, and we will email you when it is approved.',
    });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Email or student ID already registered' });
    }
    console.error(err);
    res.status(500).json({ error: 'Registration failed' });
  }
});
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = result.rows[0];
    const passwordMatches = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatches) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    if (user.approval_status === 'pending') {
      return res.status(403).json({
        error: 'Your account is awaiting administrator approval. You will be emailed once it is approved.',
      });
    }

    if (user.approval_status === 'rejected') {
      return res.status(403).json({
        error: 'Your registration was not approved. Please contact the administrator.',
      });
    }

    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: '8h',
    });

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        mustChangePassword: user.must_change_password,
        token,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed' });
  }
});

router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  const genericMessage =
    'If that email is registered, a new temporary password has been sent to it.';

  try {
    const result = await pool.query('SELECT id, name FROM users WHERE email = $1', [email]);

    if (result.rows.length === 0) {
      return res.json({ message: genericMessage });
    }

    const user = result.rows[0];
    const tempPassword = generateTempPassword();
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Reset Your Smart Academic Planner Password',
      text: `Hello ${user.name.split(' ')[0]},\n\nWe received a request to reset your password.\n\nYour new temporary password: ${tempPassword}\n\nLog in with it and you will be asked to set a new password straight away.\n\nIf you did not request this, please log in with the temporary password and change it right away.`,
    });

    await pool.query(
      'UPDATE users SET password_hash = $1, must_change_password = TRUE WHERE id = $2',
      [hashedPassword, user.id]
    );

    res.json({ message: genericMessage });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not process the request. Please try again.' });
  }
});

router.post('/change-password', requireAuth, async (req, res) => {
  const { newPassword } = req.body;

  if (!newPassword) {
    return res.status(400).json({ error: 'New password is required' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  try {
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await pool.query(
      'UPDATE users SET password_hash = $1, must_change_password = FALSE WHERE id = $2',
      [hashedPassword, req.user.id]
    );

    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

module.exports = router;