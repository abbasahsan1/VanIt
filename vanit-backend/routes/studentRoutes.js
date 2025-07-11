const express = require('express');
const pool = require('../config/db'); // Ensure this uses mysql2/promise
const router = express.Router();

/** 
 * ---------------------------
 * Fetch Routes and Stops (GET)
 * ---------------------------
 */
router.get('/routes', async (req, res) => {
    try {
        const query = `
          SELECT r.id AS route_id, r.route_name, s.id AS stop_id, s.stop_name 
          FROM routes r 
          LEFT JOIN stops s ON s.route_id = r.id
          ORDER BY r.route_name, s.stop_name
        `;

        const [results] = await pool.query(query); // ✅ Using Promises

        // Group stops by route for frontend use
        const groupedData = results.reduce((acc, row) => {
            if (!acc[row.route_name]) {
                acc[row.route_name] = [];
            }
            if (row.stop_id) {
                acc[row.route_name].push({
                    stop_id: row.stop_id,
                    stop_name: row.stop_name
                });
            }
            return acc;
        }, {});

        res.status(200).json(groupedData);
    } catch (err) {
        console.error("❌ Error fetching routes:", err.message);
        res.status(500).json({ message: "Error fetching routes and stops" });
    }
});

/** 
 * -----------------------------------
 * Student Registration (POST)
 * -----------------------------------
 */
router.post('/student-registration', async (req, res) => {
  const {
      first_name, last_name, email, registration_number, semester,
      route_name, stop_name, phone, emergency_contact, address, picture
  } = req.body;

  try {
      const query = `
        INSERT INTO students (
          first_name, last_name, email, registration_number, semester,
          route_name, stop_name, phone, emergency_contact, address, picture
        ) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      await pool.query(query, [
          first_name, last_name, email, registration_number, semester,
          route_name, stop_name, phone, emergency_contact, address, picture
      ]);

      res.status(201).json({ message: "✅ Student registration successful!" });
  } catch (err) {
      console.error("❌ Database error:", err.message);
      res.status(500).json({ message: "Error submitting registration form" });
  }
});

router.post('/get-student-by-email', async (req, res) => {
  const { email } = req.body;

  if (!email) return res.status(400).json({ error: 'Email is required' });

  try {
    const [result] = await pool.query(
      'SELECT id, first_name, last_name, registration_number, route_name, stop_name, phone, emergency_contact FROM students WHERE email = ?',
      [email]
    );
    if (result.length === 0) return res.status(404).json({ error: 'Student not found' });

    res.status(200).json(result[0]);
  } catch (err) {
    console.error('Error fetching student:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.post("/student/feedback", async (req, res) => {
  const { email, message } = req.body;

  if (!email || !message) {
    return res.status(400).json({ message: "Email and message are required" });
  }

  try {
    // Get student ID from email
    const [rows] = await pool.query("SELECT id FROM students WHERE email = ?", [email]);

    if (rows.length === 0) {
      return res.status(404).json({ message: "Student not found" });
    }

    const studentID = rows[0].id;

    // Insert feedback
    const [result] = await pool.query(
      "INSERT INTO student_feedback (studentID, message) VALUES (?, ?)",
      [studentID, message]
    );

    res.status(200).json({
      message: "✅ Feedback submitted successfully",
      feedbackID: result.insertId,
    });
  } catch (error) {
    console.error("❌ Error saving feedback:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});






module.exports = router;
