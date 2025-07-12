const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const pool = require('../config/db');

const otpStore = new Map();

const sendWhatsApp = (phone, otp) => {
  console.log(`Sending OTP ${otp} to WhatsApp number: ${phone}`);
  return true;
};

router.post('/send-otp', async (req, res) => {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ error: 'Phone number required' });

  try {
    const [rows] = await pool.query('SELECT * FROM captains WHERE phone = ?', [phone]);
    if (rows.length === 0) return res.status(404).json({ error: 'Captain not found' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore.set(phone, otp);
    sendWhatsApp(phone, otp);

    res.status(200).json({ message: 'OTP sent successfully' });
  } catch (err) {
    console.error('Error sending OTP:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/verify-otp', async (req, res) => {
  const { phone, otp } = req.body;
  const storedOtp = otpStore.get(phone);
  if (storedOtp !== otp) return res.status(400).json({ error: 'Invalid OTP' });

  otpStore.delete(phone);

  const [captains] = await pool.query('SELECT * FROM captains WHERE phone = ?', [phone]);
  const captain = captains[0];
  const token = jwt.sign({ id: captain.id, role: 'captain' }, process.env.JWT_SECRET, { expiresIn: '1h' });

  res.json({ message: 'OTP verified', token });
});

router.post('/set-password', async (req, res) => {
  const { phone, password } = req.body;
  if (!phone || !password) {
    return res.status(400).json({ message: 'Phone and password are required' });
  }

  try {
    const [rows] = await pool.query('SELECT * FROM captains WHERE phone = ?', [phone]);
    if (rows.length === 0) return res.status(404).json({ message: 'Captain not found' });

    const hashedPassword = await bcrypt.hash(password, 10);
    await pool.query('UPDATE captains SET password = ? WHERE phone = ?', [hashedPassword, phone]);

    res.status(200).json({ message: 'Password set successfully' });
  } catch (error) {
    console.error('Error setting password:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/login', async (req, res) => {
  const { phone, password } = req.body;
  const [rows] = await pool.query('SELECT * FROM captains WHERE phone = ?', [phone]);
  if (rows.length === 0) return res.status(404).json({ message: 'Captain not found' });

  const match = await bcrypt.compare(password, rows[0].password);
  if (!match) return res.status(401).json({ message: 'Invalid password' });

  const token = jwt.sign({ id: rows[0].id }, process.env.JWT_SECRET);
  res.status(200).json({ token });
});

router.post('/check-phone', async (req, res) => {
  const { phone } = req.body;
  const [rows] = await pool.query('SELECT * FROM captains WHERE phone = ?', [phone]);
  if (rows.length === 0) {
    return res.status(404).json({ message: 'Captain not found' });
  }
  const hasPassword = !!rows[0].password;
  const captainId = rows[0].id;
  const routeName = rows[0].route_name;
  const isActive = rows[0].is_active === 1;
  res.status(200).json({ 
    exists: true, 
    hasPassword, 
    captainId, 
    routeName, 
    isActive 
  });
});

router.post('/check-phone-token', async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: "Unauthorized" });
  
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const [rows] = await pool.query("SELECT * FROM captains WHERE id = ?", [decoded.id]);
      if (rows.length === 0) return res.status(404).json({ message: "Captain not found" });
  
      const hasPassword = !!rows[0].password;
      const phone = rows[0].phone;
      res.status(200).json({ hasPassword, phone });
    } catch (error) {
      console.error("JWT verify failed:", error);
      res.status(500).json({ message: "Token invalid or expired" });
    }
  });

  router.post('/assigned-route', async (req, res) => {
    const { phone } = req.body;
  
    try {
      const [cap] = await pool.query('SELECT route_name FROM captains WHERE phone = ?', [phone]);
      const routeName = cap[0]?.route_name;
  
      if (!routeName) {
        return res.status(404).json({ message: 'Captain has no route assigned' });
      }
  
      const [routeRow] = await pool.query('SELECT id FROM routes WHERE route_name = ?', [routeName]);
      const routeId = routeRow[0]?.id;
  
      if (!routeId) {
        return res.status(404).json({ message: 'Route not found' });
      }
  
      const [stops] = await pool.query('SELECT stop_name FROM stops WHERE route_id = ?', [routeId]);
  
      res.status(200).json({ routeName, stops: stops.map(s => s.stop_name) });
  
    } catch (err) {
      console.error("Error in /assigned-route:", err);
      res.status(500).json({ message: 'Error fetching route data' });
    }
  });

  router.post('/start-ride', async (req, res) => {
    const { phone, routeName } = req.body;
  
    try {
      const [cap] = await pool.query('SELECT id FROM captains WHERE phone = ?', [phone]);
      if (cap.length === 0) {
        return res.status(404).json({ message: 'Captain not found' });
      }
  
      const captainId = cap[0].id;
      
      await pool.query('UPDATE captains SET is_active = 1 WHERE id = ?', [captainId]);
      
      res.status(200).json({ message: 'Ride started successfully', captainId, routeName });
  
    } catch (err) {
      console.error("Error in /start-ride:", err);
      res.status(500).json({ message: 'Error starting ride' });
    }
  });

  router.post('/stop-ride', async (req, res) => {
    const { phone } = req.body;
  
    try {
      const [cap] = await pool.query('SELECT id FROM captains WHERE phone = ?', [phone]);
      if (cap.length === 0) {
        return res.status(404).json({ message: 'Captain not found' });
      }
  
      const captainId = cap[0].id;
      
      await pool.query('UPDATE captains SET is_active = 0 WHERE id = ?', [captainId]);
      
      res.status(200).json({ message: 'Ride stopped successfully', captainId });
  
    } catch (err) {
      console.error("Error in /stop-ride:", err);
      res.status(500).json({ message: 'Error stopping ride' });
    }
  });

  // Captain profile endpoint for SOS functionality
  router.get('/profile/:phone', async (req, res) => {
    const { phone } = req.params;
  
    try {
      const [captains] = await pool.query(
        'SELECT id, first_name, last_name, phone, route_name, alternate_phone FROM captains WHERE phone = ?', 
        [phone]
      );
      
      if (captains.length === 0) {
        return res.status(404).json({ 
          success: false, 
          message: 'Captain not found' 
        });
      }
      
      res.status(200).json({ 
        success: true, 
        data: captains[0] 
      });
      
    } catch (err) {
      console.error("Error fetching captain profile:", err);
      res.status(500).json({ 
        success: false, 
        message: 'Error fetching captain profile' 
      });
    }
  });

module.exports = router;

