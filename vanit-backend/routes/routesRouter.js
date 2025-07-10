const express = require("express");
const router = express.Router();
const pool = require("../config/db");

// ✅ Add a New Route with Stops (Unchanged)
router.post("/routes", async (req, res) => {
    const { route_name, stops } = req.body;

    if (!route_name || !stops || !stops.length) {
        return res.status(400).json({ error: "Route name and at least one stop are required" });
    }

    try {
        const [routeResult] = await pool.query("INSERT INTO routes (route_name) VALUES (?)", [route_name]);
        const routeId = routeResult.insertId;

        for (const stop of stops) {
            await pool.query("INSERT INTO stops (stop_name, route_id) VALUES (?, ?)", [stop, routeId]);
        }

        res.status(201).json({ message: "Route added successfully!" });
    } catch (error) {
        console.error("Error adding route:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// ✅ Fix API response for Fetching Routes and Stops

router.get("/routes", async (req, res) => {
    try {
        const [routes] = await pool.query("SELECT * FROM routes");
        const [stops] = await pool.query("SELECT * FROM stops");

        // ✅ Convert to an array instead of an object
        const formattedRoutes = routes.map(route => ({
            route_id: route.id,
            route_name: route.route_name,
            stops: stops
                .filter(stop => stop.route_id === route.id)
                .map(stop => ({
                    stop_id: stop.id,
                    stop_name: stop.stop_name
                }))
        }));

        console.log("✅ Backend API Response (Fixed):", JSON.stringify(formattedRoutes, null, 2));

        res.status(200).json({ routes: formattedRoutes });  // ✅ Return an array inside an object
    } catch (error) {
        console.error("❌ Error fetching routes:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});


// ✅ Delete a Route (Fetch ID First)
router.delete("/routes/:route_name", async (req, res) => {
    const { route_name } = req.params;

    try {
        // Fetch route ID based on route_name
        const [routeData] = await pool.query("SELECT id FROM routes WHERE route_name = ?", [route_name]);

        if (routeData.length === 0) {
            return res.status(404).json({ error: "Route not found" });
        }

        const routeId = routeData[0].id;

        // Delete associated stops
        await pool.query("DELETE FROM stops WHERE route_id = ?", [routeId]);

        // Delete route
        await pool.query("DELETE FROM routes WHERE id = ?", [routeId]);

        res.status(200).json({ message: "Route deleted successfully!" });
    } catch (error) {
        console.error("Error deleting route:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// ✅ Update a Route Name & Stops
router.put("/routes/:route_name", async (req, res) => {
    const { route_name } = req.params;
    const { new_route_name, stops } = req.body;

    console.log(`🔹 Received Update Request for Route: ${route_name}`);
    console.log(`🔹 New Route Name: ${new_route_name}`);
    console.log(`🔹 Stops:`, stops);

    try {
        // ✅ Check if Route Exists
        const [existingRoutes] = await pool.query("SELECT * FROM routes WHERE route_name = ?", [route_name]);
        if (existingRoutes.length === 0) {
            console.log(`❌ Route ${route_name} not found.`);
            return res.status(404).json({ error: "❌ Route not found." });
        }

        console.log(`✅ Route Found:`, existingRoutes[0]);

        // ✅ Update Route Name
        await pool.query("UPDATE routes SET route_name = ? WHERE route_name = ?", [new_route_name, route_name]);

        console.log(`✅ Route Name Updated: ${route_name} → ${new_route_name}`);

        // ✅ Delete Old Stops and Insert Updated Stops
        await pool.query("DELETE FROM stops WHERE route_id = (SELECT id FROM routes WHERE route_name = ?)", [new_route_name]);
        console.log(`✅ Deleted old stops for ${new_route_name}`);

        if (stops && stops.length > 0) {
            for (const stop of stops) {
                await pool.query(
                    "INSERT INTO stops (stop_name, route_id) VALUES (?, (SELECT id FROM routes WHERE route_name = ?))",
                    [stop.stop_name, new_route_name]
                );
                console.log(`✅ Inserted Stop: ${stop.stop_name}`);
            }
        }

        res.status(200).json({ message: "✅ Route updated successfully!" });
    } catch (error) {
        console.error("❌ Error updating route:", error);
        res.status(500).json({ error: "❌ Internal server error", details: error.message });
    }
});



// Get all routes
router.get('/routes/all', async (req, res) => {
    try {
      const [routes] = await pool.query('SELECT id, route_name FROM routes');
      res.status(200).json(routes);
    } catch (error) {
      console.error("❌ Error fetching routes:", error);
      res.status(500).json({ message: 'Error fetching routes' });
    }
  });
  
  

module.exports = router;
