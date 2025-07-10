const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// Save Feedback
router.post('/submit', async (req, res) => {
  const { student_email, name, reg_no, route_name, stop_name, message } = req.body;
  try {
    await pool.query(
      'INSERT INTO feedbacks (student_email, name, reg_no, route_name, stop_name, message) VALUES (?, ?, ?, ?, ?, ?)',
      [student_email, name, reg_no, route_name, stop_name, message]
    );
    res.status(200).json({ message: 'Feedback submitted successfully' });
  } catch (err) {
    console.error('❌ Error saving feedback:', err);
    res.status(500).json({ message: 'Failed to submit feedback' });
  }
});

// Get All Feedback (for admin)
router.get('/all', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM feedbacks ORDER BY created_at DESC');
    res.status(200).json(rows);
  } catch (err) {
    console.error('❌ Error fetching feedbacks:', err);
    res.status(500).json({ message: 'Failed to fetch feedbacks' });
  }
});

module.exports = router;
