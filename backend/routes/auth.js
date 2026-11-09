const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const pool = require('../config/db');
const jwt = require('jsonwebtoken');

const crypto = require('crypto');
const transporter = require('../config/mailer');

function generateTempPassword() {
  return crypto.randomBytes(6).toString('hex'); // e.g. "a1b2c3d4e5f6"
}

router.post('/register', async (req, res) => {
  const {
    firstName,
    lastName,
    email,
    phoneNumber,
    role,
    studentId,
    classGroup,
    lecturerCode,
  } = req.body;

  if (!firstName || !lastName || !email || !phoneNumber || !role) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  if (role === 'student') {
    const studentIdPattern = /^[A-Z]{3}\d{3}-[A-Z]\d{3}-\d{4}\/\d{4}$/;
    if (!studentId || !studentIdPattern.test(studentId)) {
      return res.status(400).json({ error: 'A valid student ID is required' });
    }
    if (!classGroup) {
      return res.status(400).json({ error: 'Class/group is required for students' });
    }
  } else if (role === 'lecturer') {
    if (lecturerCode !== process.env.LECTURER_ACCESS_CODE) {
      return res.status(403).json({ error: 'Invalid lecturer access code' });
    }
  } else {
    return res.status(400).json({ error: 'Invalid role' });
  }

  try {
    const tempPassword = generateTempPassword();
    const hashedPassword = await bcrypt.hash(tempPassword, 10);
    const fullName = `${firstName} ${lastName}`;
    const approvalStatus = role === 'lecturer' ? 'pending' : 'approved';

    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash, role, phone_number, student_id, class_group, must_change_password, approval_status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE, $8)
       RETURNING id, name, email, role`,
      [
        fullName,
        email,
        hashedPassword,
        role,
        phoneNumber,
        role === 'student' ? studentId : null,
        role === 'student' ? classGroup : null,
        approvalStatus,
      ]
    );

    const approvalNote =
      role === 'lecturer'
        ? '\n\nYour account is awaiting approval by the administrator. You will be able to log in once it is approved, and we will email you when that happens.'
        : '\n\nPlease log in and change this password immediately.';

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Your Smart Academic Planner Account',
      text: `Hello ${firstName},\n\nYour account has been created.\n\nTemporary password: ${tempPassword}${approvalNote}`,
    });

    res.status(201).json({
      user: result.rows[0],
      pendingApproval: role === 'lecturer',
      message:
        role === 'lecturer'
          ? 'Registration received. Your account is awaiting administrator approval.'
          : 'Registration successful. Check your email for your temporary password.',
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

module.exports = router;