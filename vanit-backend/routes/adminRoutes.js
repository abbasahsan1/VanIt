const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const pool = require("../config/db");

const adminUsername = "admin";
const adminPassword = "password123"; // Change this in production

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (username === adminUsername && password === adminPassword) {
    const token = jwt.sign({ role: "admin" }, process.env.JWT_SECRET, { expiresIn: "1h" });
    res.json({ token });
  } else {
    res.status(401).json({ message: "Invalid Credentials" });
  }
});

router.get('/routes/all', async (req, res) => {
  try {
    const [routes] = await pool.query('SELECT id, route_name FROM routes');
    res.status(200).json(routes);
  } catch (error) {
    console.error("❌ Error fetching all routes:", error);
    res.status(500).json({ message: 'Error fetching routes' });
  }
});

// PUT: Assign route to a captain using phone
router.put('/assign-route', async (req, res) => {
  const { phone, routeName } = req.body;
  try {
    const [result] = await pool.query(
      'UPDATE captains SET route_name = ? WHERE phone = ?',
      [routeName, phone]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Captain not found" });
    }

    res.status(200).json({ message: "Route assigned successfully" });
  } catch (err) {
    console.error("❌ Error assigning route:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

/**
 * ---------------------------
 * ✅ ADMIN ATTENDANCE ENDPOINTS
 * ---------------------------
 */

// Get attendance statistics for admin dashboard
router.get('/attendance/stats', async (req, res) => {
  try {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    // Get total attendance for today
    const [attendanceToday] = await pool.query(`
      SELECT COUNT(*) as totalAttended 
      FROM attendance_logs 
      WHERE DATE(scan_timestamp) = ? AND scan_success = 1
    `, [todayStr]);

    // Get total registered students
    const [totalStudents] = await pool.query(`
      SELECT COUNT(*) as totalRegistered FROM students
    `);

    // Get active sessions count
    const [activeSessions] = await pool.query(`
      SELECT COUNT(DISTINCT captain_id) as activeSessions 
      FROM boarding_sessions 
      WHERE session_end IS NULL
    `);

    // Calculate attendance rate
    const totalAttended = attendanceToday[0].totalAttended || 0;
    const totalRegistered = totalStudents[0].totalRegistered || 1;
    const attendanceRate = Math.round((totalAttended / totalRegistered) * 100);

    res.status(200).json({
      totalAttended,
      totalRegistered,
      activeSessions: activeSessions[0].activeSessions || 0,
      attendanceRate
    });

  } catch (error) {
    console.error('Error fetching attendance stats:', error);
    res.status(500).json({ message: 'Error fetching attendance statistics' });
  }
});

// Get active boarding sessions for admin
router.get('/attendance/active-sessions', async (req, res) => {
  try {
    const [sessions] = await pool.query(`
      SELECT 
        bs.id as session_id,
        bs.captain_id,
        bs.route_name,
        bs.session_start,
        bs.students_onboard,
        c.first_name as captain_first_name,
        c.last_name as captain_last_name
      FROM boarding_sessions bs
      JOIN captains c ON bs.captain_id = c.id
      WHERE bs.session_end IS NULL
      ORDER BY bs.session_start DESC
    `);

    res.status(200).json(sessions);

  } catch (error) {
    console.error('Error fetching active sessions:', error);
    res.status(500).json({ message: 'Error fetching active sessions' });
  }
});

// Generate QR code for specific route (admin only)
router.post('/attendance/generate-qr', async (req, res) => {
  try {
    const { routeName } = req.body;
    
    if (!routeName) {
      return res.status(400).json({ 
        success: false, 
        error: 'Route name is required' 
      });
    }

    // Verify route exists
    const [routeData] = await pool.query(
      'SELECT route_name FROM routes WHERE route_name = ?',
      [routeName]
    );

    if (routeData.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Route not found'
      });
    }

    // Generate QR data (timestamp + route for uniqueness)
    const qrData = `VANIT_ROUTE:${routeName}:${Date.now()}`;

    res.status(200).json({
      success: true,
      message: 'QR code generated successfully',
      qrCode: qrData,
      routeName: routeName,
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error generating QR code:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate QR code'
    });
  }
});

module.exports = router;

