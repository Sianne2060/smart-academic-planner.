const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const transporter = require('../config/mailer');
const { requireAuth, requireAdmin } = require('../middleware/auth');

router.use(requireAuth, requireAdmin);

router.get('/pending-lecturers', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, email, phone_number, created_at
       FROM users
       WHERE role = 'lecturer' AND approval_status = 'pending'
       ORDER BY created_at ASC`
    );
    res.json({ lecturers: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not load pending lecturers' });
  }
});

router.post('/lecturers/:id/approve', async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE users SET approval_status = 'approved'
       WHERE id = $1 AND role = 'lecturer'
       RETURNING name, email`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Lecturer not found' });
    }

    const lecturer = result.rows[0];

    try {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: lecturer.email,
        subject: 'Your Smart Academic Planner Account Has Been Approved',
        text: `Hello ${lecturer.name.split(' ')[0]},\n\nYour lecturer account has been approved. You can now log in using the temporary password we emailed you when you registered.`,
      });
    } catch (mailErr) {
      console.error('Approval email failed:', mailErr);
    }

    res.json({ message: 'Lecturer approved' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not approve lecturer' });
  }
});

router.post('/lecturers/:id/reject', async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE users SET approval_status = 'rejected'
       WHERE id = $1 AND role = 'lecturer'
       RETURNING id`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Lecturer not found' });
    }

    res.json({ message: 'Lecturer rejected' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not reject lecturer' });
  }
});

router.get('/stats', async (req, res) => {
  try {
    const users = await pool.query(
      `SELECT role, COUNT(*)::int AS count FROM users GROUP BY role`
    );
    const pending = await pool.query(
      `SELECT COUNT(*)::int AS count FROM users
       WHERE role = 'lecturer' AND approval_status = 'pending'`
    );
    const tasks = await pool.query(
      `SELECT type, COUNT(*)::int AS count FROM tasks GROUP BY type`
    );
    const classes = await pool.query(
      `SELECT class_group, COUNT(*)::int AS count FROM users
       WHERE role = 'student' AND class_group IS NOT NULL
       GROUP BY class_group ORDER BY class_group`
    );

    res.json({
      users: users.rows,
      pendingLecturers: pending.rows[0].count,
      tasksByType: tasks.rows,
      studentsByClass: classes.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not load statistics' });
  }
});

module.exports = router;