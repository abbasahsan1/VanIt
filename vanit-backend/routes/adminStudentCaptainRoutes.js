const express = require('express');
const multer = require("multer");
const pool = require('../config/db'); // Ensure this uses mysql2/promise
const router = express.Router();

// ✅ Setup Multer for File Uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, "uploads/"); // Ensure "uploads" folder exists
    },
    filename: (req, file, cb) => {
      cb(null, `${Date.now()}-${file.originalname}`);
    },
  });
  const upload = multer({ storage: storage });

/**
 * ---------------------------
 * Fetch All Students (GET)
 * ---------------------------
 */
router.get('/students', async (req, res) => {
    try {
        const query = `
            SELECT first_name, last_name, registration_number, semester, route_name, stop_name, phone, emergency_contact, address 
            FROM students
        `;
        const [students] = await pool.query(query);
        res.status(200).json(students);
    } catch (error) {
        console.error("Error fetching students:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

/**
 * ---------------------------
 * Update Student by First Name (PUT)
 * ---------------------------
 */
router.put('/students/update/:first_name', async (req, res) => {
    const { first_name } = req.params;
    const { last_name, registration_number, semester, route_name, stop_name, phone, emergency_contact, address } = req.body;

    try {
        // ✅ Check if student exists before updating
        const [existingStudent] = await pool.query("SELECT * FROM students WHERE first_name = ?", [first_name]);
        
        if (existingStudent.length === 0) {
            return res.status(404).json({ error: "❌ Student not found!" });
        }

        // ✅ Update Student Data in Database
        const query = `
            UPDATE students 
            SET last_name = ?, registration_number = ?, semester = ?, route_name = ?, stop_name = ?, phone = ?, emergency_contact = ?, address = ?
            WHERE first_name = ?
        `;
        
        const [result] = await pool.query(query, [
            last_name, registration_number, semester, route_name, stop_name, phone, emergency_contact, address, first_name
        ]);

        res.status(200).json({ message: "✅ Student updated successfully!" });
    } catch (error) {
        console.error("❌ Error updating student:", error);
        res.status(500).json({ error: "❌ Internal Server Error" });
    }
});

/**
 * ---------------------------
 * Delete Student by First Name (DELETE)
 * ---------------------------
 */
router.delete('/students/delete/:first_name', async (req, res) => {
    const { first_name } = req.params;

    try {
        // ✅ Check if student exists
        const [existingStudent] = await pool.query("SELECT * FROM students WHERE first_name = ?", [first_name]);

        if (existingStudent.length === 0) {
            return res.status(404).json({ error: "❌ Student not found!" });
        }

        // ✅ Delete the student
        const query = "DELETE FROM students WHERE first_name = ?";
        await pool.query(query, [first_name]);

        res.status(200).json({ message: "✅ Student deleted successfully!" });
    } catch (error) {
        console.error("❌ Error deleting student:", error);
        res.status(500).json({ error: "❌ Internal Server Error" });
    }
});


/**
 * ---------------------------
 * Fetch All Captains (GET)
 * ---------------------------
 */
router.get('/captains', async (req, res) => {
    try {
        const query = `
            SELECT first_name, last_name, email, phone, route_name
            FROM captains
        `;
        const [captains] = await pool.query(query);

        res.status(200).json(captains);
    } catch (error) {
        console.error("❌ Error fetching captains:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

/**
 * ---------------------------
 * Add a New Captain (POST)
 * ---------------------------
 */
// ✅ Add Captain Route (POST)
router.post("/captains", 
    upload.fields([
      { name: "cnic_picture", maxCount: 1 },
      { name: "driving_license_picture", maxCount: 1 }
    ]), 
    async (req, res) => {
      const {
        first_name, last_name, dob, cnic, driving_license, phone,
        alternate_phone, email, address, route, bus_no // ✅ Added bus_no
      } = req.body;
  
      // ✅ Validate Required Fields
      if (!first_name || !last_name || !dob || !cnic || !driving_license || !phone || !email || !route || !bus_no) {
        return res.status(400).json({ error: "❌ All required fields must be filled!" });
      }
  
      try {
        // ✅ Check if files were uploaded safely
        const cnicPicturePath = req.files && req.files["cnic_picture"] ? req.files["cnic_picture"][0].filename : null;
        const drivingLicensePath = req.files && req.files["driving_license_picture"] ? req.files["driving_license_picture"][0].filename : null;
  
        // ✅ Insert into MySQL Database
        const query = `
          INSERT INTO captains (first_name, last_name, dob, cnic, cnic_picture,
            driving_license, driving_license_picture, phone, alternate_phone, email, address, route_name, bus_no)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
  
        await pool.query(query, [
          first_name, last_name, dob, cnic, cnicPicturePath,
          driving_license, drivingLicensePath, phone, alternate_phone, email, address, route, bus_no
        ]);
  
        res.status(201).json({ message: "✅ Captain added successfully!" });
      } catch (error) {
        console.error("❌ Error adding captain:", error);
        res.status(500).json({ error: "❌ Internal Server Error" });
      }
  });

  // Assign route to captain
router.post('/assign-route-to-captain', async (req, res) => {
  const { captainId, routeName } = req.body;

  try {
    await pool.query('UPDATE captains SET route_name = ? WHERE id = ?', [routeName, captainId]);
    res.status(200).json({ message: 'Route assigned to captain successfully!' });
  } catch (err) {
    console.error('Error assigning route:', err);
    res.status(500).json({ message: 'Failed to assign route' });
  }
});

  
  module.exports = router;



