const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const pool = require('../config/db');
const transporter = require('../config/mailer');
const { requireAuth, requireAdmin } = require('../middleware/auth');

router.use(requireAuth, requireAdmin);

function generateTempPassword() {
  return crypto.randomBytes(6).toString('hex');
}

/* ---------- Students: approval ---------- */

router.get('/pending-students', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, email, phone_number, student_id, class_group, created_at
       FROM users
       WHERE role = 'student' AND approval_status = 'pending'
       ORDER BY created_at ASC`
    );
    res.json({ students: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not load pending students' });
  }
});

router.post('/students/:id/approve', async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE users SET approval_status = 'approved'
       WHERE id = $1 AND role = 'student' AND approval_status = 'pending'
       RETURNING name, email`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Pending student not found' });
    }

    const student = result.rows[0];

    try {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: student.email,
        subject: 'Your Smart Academic Planner Account Has Been Approved',
        text: `Hello ${student.name.split(' ')[0]},\n\nYour student account has been approved. You can now log in using the temporary password we emailed you when you registered.`,
      });
    } catch (mailErr) {
      console.error('Approval email failed:', mailErr);
    }

    res.json({ message: 'Student approved' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not approve student' });
  }
});

router.post('/students/:id/reject', async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE users SET approval_status = 'rejected'
       WHERE id = $1 AND role = 'student' AND approval_status = 'pending'
       RETURNING id`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Pending student not found' });
    }

    res.json({ message: 'Student rejected' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not reject student' });
  }
});

/* ---------- Lecturers: created by the admin ---------- */

router.get('/lecturers', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, email, phone_number, created_at
       FROM users
       WHERE role = 'lecturer'
       ORDER BY name`
    );
    res.json({ lecturers: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not load lecturers' });
  }
});

router.post('/lecturers', async (req, res) => {
  const { firstName, lastName, email, phoneNumber } = req.body;

  if (!firstName || !lastName || !email || !phoneNumber) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    const tempPassword = generateTempPassword();
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash, role, phone_number, must_change_password, approval_status)
       VALUES ($1, $2, $3, 'lecturer', $4, TRUE, 'approved')
       RETURNING id, name, email`,
      [`${firstName.trim()} ${lastName.trim()}`, email.trim(), hashedPassword, phoneNumber.trim()]
    );

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email.trim(),
      subject: 'Your Smart Academic Planner Lecturer Account',
      text: `Hello ${firstName.trim()},\n\nA lecturer account has been created for you.\n\nTemporary password: ${tempPassword}\n\nPlease log in and change this password immediately.`,
    });

    res.status(201).json({
      lecturer: result.rows[0],
      message: 'Lecturer account created and the temporary password was emailed.',
    });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'A user with that email already exists' });
    }
    console.error(err);
    res.status(500).json({ error: 'Could not create the lecturer account' });
  }
});

/* ---------- Student roster ---------- */

router.get('/roster', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT r.id, r.student_id, r.full_name, r.class_group,
              (u.id IS NOT NULL) AS registered
       FROM student_roster r
       LEFT JOIN users u ON u.student_id = r.student_id
       ORDER BY r.class_group, r.full_name`
    );
    res.json({ students: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not load the roster' });
  }
});

router.post('/roster', async (req, res) => {
  const { studentId, fullName, classGroup } = req.body;

  if (!studentId || !fullName || !classGroup) {
    return res.status(400).json({ error: 'Student ID, name and class are required' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO student_roster (student_id, full_name, class_group)
       VALUES ($1, $2, $3)
       RETURNING id, student_id, full_name, class_group`,
      [studentId.trim().toUpperCase(), fullName.trim(), classGroup.trim()]
    );
    res.status(201).json({ student: result.rows[0] });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'That student ID is already on the roster' });
    }
    console.error(err);
    res.status(500).json({ error: 'Could not add the student' });
  }
});

router.post('/roster/import', async (req, res) => {
  const { students } = req.body;

  if (!Array.isArray(students) || students.length === 0) {
    return res.status(400).json({ error: 'No students to import' });
  }

  if (students.length > 500) {
    return res.status(400).json({ error: 'Please import 500 students or fewer at a time' });
  }

  let added = 0;
  let skipped = 0;

  try {
    for (const s of students) {
      if (!s.studentId || !s.fullName || !s.classGroup) {
        skipped++;
        continue;
      }

      const result = await pool.query(
        `INSERT INTO student_roster (student_id, full_name, class_group)
         VALUES ($1, $2, $3)
         ON CONFLICT (student_id) DO NOTHING`,
        [s.studentId.trim().toUpperCase(), s.fullName.trim(), s.classGroup.trim()]
      );

      if (result.rowCount === 1) added++;
      else skipped++;
    }

    res.json({ added, skipped });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Import failed' });
  }
});

router.delete('/roster/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM student_roster WHERE id = $1 RETURNING id',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Student not found on the roster' });
    }

    res.json({ message: 'Removed from the roster' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not remove the student' });
  }
});

/* ---------- Overview and reports ---------- */

router.get('/stats', async (req, res) => {
  try {
    const users = await pool.query(
      `SELECT role, COUNT(*)::int AS count FROM users GROUP BY role`
    );
    const pending = await pool.query(
      `SELECT COUNT(*)::int AS count FROM users
       WHERE role = 'student' AND approval_status = 'pending'`
    );
    const tasks = await pool.query(
      `SELECT type, COUNT(*)::int AS count FROM tasks GROUP BY type`
    );
    const classes = await pool.query(
      `SELECT class_group, COUNT(*)::int AS count FROM users
       WHERE role = 'student' AND approval_status = 'approved' AND class_group IS NOT NULL
       GROUP BY class_group ORDER BY class_group`
    );

    res.json({
      users: users.rows,
      pendingStudents: pending.rows[0].count,
      tasksByType: tasks.rows,
      studentsByClass: classes.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not load statistics' });
  }
});

module.exports = router;