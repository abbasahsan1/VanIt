const express = require("express");
const pool = require("../config/db");
const router = express.Router();

/**
 * ✅ Receive Emergency Alert from Student (POST)
 * API: `/api/emergency-alerts/send-alert`
 */
router.post("/send-alert", async (req, res) => {
    const { first_name, last_name, registration_number, phone, route_name, stop_name } = req.body;

    // 🔹 Check if all required fields are present
    if (!first_name || !last_name || !registration_number || !phone || !route_name || !stop_name) {
        return res.status(400).json({ error: "❌ Missing required fields!" });
    }

    try {
        const query = `
            INSERT INTO emergency_alerts (first_name, last_name, registration_number, phone, route_name, stop_name)
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        await pool.query(query, [first_name, last_name, registration_number, phone, route_name, stop_name]);

        res.status(201).json({ message: "✅ Emergency alert received successfully!" });
    } catch (error) {
        console.error("❌ Error storing emergency alert:", error);
        res.status(500).json({ error: "❌ Internal server error" });
    }
});


/**
 * ✅ Fetch Emergency Alerts for Admin
 * API: `/api/emergency-alerts/admin`
 */
router.get("/admin", async (req, res) => {
    try {
        const query = `SELECT * FROM emergency_alerts ORDER BY timestamp DESC`;
        const [alerts] = await pool.query(query);
        res.status(200).json(alerts);
    } catch (error) {
        console.error("❌ Error fetching emergency alerts:", error);
        res.status(500).json({ error: "❌ Internal server error" });
    }
});

module.exports = router;
