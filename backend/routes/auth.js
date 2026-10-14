const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const pool = require('../config/db');

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

    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash, role, phone_number, student_id, class_group, must_change_password)
       VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE)
       RETURNING id, name, email, role`,
      [
        fullName,
        email,
        hashedPassword,
        role,
        phoneNumber,
        role === 'student' ? studentId : null,
        role === 'student' ? classGroup : null,
      ]
    );

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Your Smart Academic Planner Account',
      text: `Hello ${firstName},\n\nYour account has been created.\n\nTemporary password: ${tempPassword}\n\nPlease log in and change this password immediately.`,
    });

    res.status(201).json({ user: result.rows[0], message: 'Registration successful. Check your email for your temporary password.' });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Email or student ID already registered' });
    }
    console.error(err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

module.exports = router;