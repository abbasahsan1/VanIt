import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { FaEdit, FaHome, FaPlus, FaTrash, FaUserCircle } from "react-icons/fa";

const EditRoute = () => {
  const [routes, setRoutes] = useState([]);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [routeName, setRouteName] = useState("");
  const [stops, setStops] = useState([]);
  const navigate = useNavigate();

  // ✅ Fetch Routes from API
  useEffect(() => {
    const fetchRoutes = async () => {
        try {
            const response = await axios.get("http://localhost:5000/api/routes");
            console.log("✅ Routes API Response:", response.data);

            // 🔥 Convert Object to Array for Mapping
            if (response.data && typeof response.data === "object") {
                const formattedRoutes = Object.keys(response.data).map(routeName => ({
                    route_id: routeName, // API returns route name as key, so use it as route_id
                    route_name: routeName,
                    stops: response.data[routeName] || [] // Ensure stops is always an array
                }));

                setRoutes(formattedRoutes);
            } else {
                console.error("❌ Unexpected API response format:", response.data);
                setRoutes([]); // Set empty array if response is invalid
            }
        } catch (error) {
            console.error("❌ Error fetching routes:", error);
            setRoutes([]); // Handle API failure
        }
    };

    fetchRoutes();
    console.log("📌 Selected Route ID:", selectedRoute);
}, []);


  // ✅ Handle Selecting a Route to Edit
  const handleSelectRoute = (route) => {
    console.log("✅ Selected Route:", route);
    
    if (!route || !route.route_name) {
        alert("❌ Invalid Route Selection.");
        return;
    }

    setSelectedRoute(route.route_name); // ✅ Use `route_name` instead of `route_id`
    setRouteName(route.route_name); 
    setStops(route.stops.map((stop) => stop.stop_name)); 
};



  // ✅ Handle Updating Stops
  const handleStopChange = (index, value) => {
    const updatedStops = [...stops];
    updatedStops[index] = value;
    setStops(updatedStops);
  };

  // ✅ Handle Submitting the Updated Route
  const handleUpdateRoute = async () => {
    if (!selectedRoute || !routeName.trim()) {
        alert("❌ Please select a route and enter a valid name.");
        return;
    }

    try {
        console.log(`🚀 Updating Route: ${selectedRoute}, New Name: ${routeName}`);

        // ✅ Ensure `route_name` matches the backend
        const formattedStops = stops
            .filter(stop => stop.trim() !== "")
            .map(stop => ({ stop_name: stop }));

        const response = await axios.put(`http://localhost:5000/api/routes/${encodeURIComponent(selectedRoute)}`, {
            new_route_name: routeName, // ✅ Change `route_name` to `new_route_name`
            stops: formattedStops,
        });

        alert("✅ Route updated successfully!");
        console.log("✅ API Response:", response.data);
        navigate("/routes"); 
    } catch (error) {
        console.error("❌ Error updating route:", error.response?.data || error);
        alert("❌ Failed to update route! Check console.");
    }
};





  return (
    <div className="min-h-screen bg-[#B3D9FF] flex flex-col">
      
      {/* ✅ Navigation Bar */}
      <nav className="bg-white p-4 shadow-md flex justify-between items-center">
        <div className="flex items-center">
          <img src="/1.png" alt="Logo" className="w-12 h-12 mr-3" />
          <h1 className="text-orange-600 font-bold text-lg">Capital University of Science and Technology</h1>
        </div>
        <div className="flex space-x-8 text-blue-600 font-semibold text-lg">
          <Link to="/dashboard" className="hover:text-blue-800 flex items-center"><FaHome className="mr-1" /> Home</Link>
          <Link to="/routes" className="hover:text-blue-800 flex items-center"><FaPlus className="mr-1" /> Routes</Link>
          <Link to="/add-route" className="hover:text-blue-800 flex items-center"><FaPlus className="mr-1" /> Add Route</Link>
          <Link to="/delete-route" className="hover:text-blue-800 flex items-center"><FaTrash className="mr-1" /> Delete Route</Link>
          <button className="hover:text-blue-800">Logout</button>
        </div>
        <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
          <FaUserCircle className="text-gray-600 text-2xl" />
        </div>
      </nav>

      {/* ✅ Edit Route Section */}
      <div className="p-10">
        <div className="bg-white shadow-lg rounded-lg p-6">
          <h1 className="text-2xl font-bold text-blue-600 mb-4">Edit Routes</h1>

          {/* ✅ Select Route Dropdown */}
          <select onChange={(e) => handleSelectRoute(routes.find(route => route.route_id == e.target.value))} className="w-full p-3 border rounded-lg mb-4">
            <option value="">Select a Route</option>
            {routes.map((route) => (
              <option key={route.route_id} value={route.route_id}>
                {route.route_name}
              </option>
            ))}
          </select>

          {/* ✅ Route Name Input */}
          <input
            type="text"
            value={routeName}
            onChange={(e) => setRouteName(e.target.value)}
            placeholder="Enter new route name"
            className="w-full p-3 border rounded-lg mb-4"
          />

          {/* ✅ Stops Input Fields */}
          <div className="mb-4">
            <h3 className="text-lg font-semibold mb-2">Stops:</h3>
            {stops.map((stop, index) => (
              <input
                key={index}
                type="text"
                value={stop}
                onChange={(e) => handleStopChange(index, e.target.value)}
                placeholder="Enter stop name"
                className="w-full p-3 border rounded-lg mb-2"
              />
            ))}
          </div>

          {/* ✅ Update Button */}
          <button
            onClick={handleUpdateRoute}
            className="w-full py-3 bg-blue-500 text-white font-bold rounded-lg hover:bg-blue-700 transition duration-200"
          >
            Update Route
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditRoute;
