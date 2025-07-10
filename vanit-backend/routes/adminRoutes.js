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




module.exports = router;

