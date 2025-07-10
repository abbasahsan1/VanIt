import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FaTimes, FaUserCircle, FaHome, FaPlus, FaTrash, FaEdit } from "react-icons/fa";
import { Link } from "react-router-dom";

const CreateRoute = () => {
  const [routeName, setRouteName] = useState("");
  const [stops, setStops] = useState([""]); // Array of stops
  const navigate = useNavigate();

  // Add a new empty stop input field
  const addStopField = () => {
    setStops([...stops, ""]);
  };

  // Remove a stop field
  const removeStopField = (index) => {
    setStops(stops.filter((_, i) => i !== index));
  };

  // Handle change in stop fields
  const handleStopChange = (index, value) => {
    const newStops = [...stops];
    newStops[index] = value;
    setStops(newStops);
  };

  // Submit form to backend
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!routeName || stops.some((stop) => stop.trim() === "")) {
      alert("Please enter a route name and at least one stop.");
      return;
    }

    try {
      const response = await axios.post("http://localhost:5000/api/routes", {
        route_name: routeName,
        stops,
      });

      alert("Route added successfully!");
      navigate("/routes"); // Redirect to Routes Page
    } catch (error) {
      console.error("Error adding route:", error);
      alert("Failed to add route.");
    }
  };

  return (
    <div className="min-h-screen bg-[#B3D9FF] flex flex-col">
      
      {/* ✅ Navigation Bar */}
      <nav className="bg-white p-4 shadow-md flex justify-between items-center">
        <div className="flex items-center">
          <img src="/1.png" alt="Logo" className="w-12 h-12 mr-3" />
          <h1 className="text-orange-600 font-bold text-lg">
            Capital University of Science and Technology
          </h1>
        </div>
        <div className="flex space-x-8 text-blue-600 font-semibold text-lg">
          <Link to="/dashboard" className="hover:text-blue-800 flex items-center">
            <FaHome className="mr-1" /> Home
          </Link>
          <Link to="/routes" className="hover:text-blue-800 flex items-center">
            <FaPlus className="mr-1" /> Routes
          </Link>
          <Link to="/delete-route" className="hover:text-blue-800 flex items-center">
            <FaTrash className="mr-1" /> Delete Routes
          </Link>
          <Link to="/edit-route" className="hover:text-blue-800 flex items-center">
            <FaEdit className="mr-1" /> Edit Routes
          </Link>
          <button onClick={() => localStorage.removeItem("adminToken")} className="hover:text-blue-800">
            Logout
          </button>
        </div>
        <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
          <FaUserCircle className="text-gray-600 text-2xl" />
        </div>
      </nav>

      {/* ✅ Route Form */}
      <div className="flex justify-center items-center min-h-screen">
        <div className="w-full max-w-4xl bg-white shadow-lg rounded-xl p-8 relative">
          {/* Close Button */}
          <FaTimes onClick={() => navigate("/routes")} className="text-gray-600 hover:text-gray-900 absolute top-4 right-4 cursor-pointer text-2xl" />

          <h1 className="text-3xl font-extrabold text-center text-orange-500 mb-6">Add New Route</h1>

          <form onSubmit={handleSubmit}>
            {/* Route Name */}
            <input
              type="text"
              value={routeName}
              onChange={(e) => setRouteName(e.target.value)}
              placeholder="Route Name"
              required
              className="w-full p-3 mb-6 border border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
            />

            {/* Stops (Dynamic Fields) */}
            {stops.map((stop, index) => (
              <div key={index} className="flex items-center space-x-4 mb-4">
                <input
                  type="text"
                  value={stop}
                  onChange={(e) => handleStopChange(index, e.target.value)}
                  placeholder={`Stop ${index + 1}`}
                  required
                  className="w-full p-3 border border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
                {index > 0 && (
                  <button type="button" onClick={() => removeStopField(index)} className="text-red-500 hover:text-red-700">
                    <FaTimes />
                  </button>
                )}
              </div>
            ))}

            {/* Add Stop Button */}
            <button type="button" onClick={addStopField} className="w-full py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 mb-4">
              + Add Stop
            </button>

            {/* Submit Button */}
            <button type="submit" className="w-full py-3 bg-orange-500 text-white font-bold rounded-lg shadow-md hover:bg-orange-600 transition duration-200">
              Submit Route
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateRoute;
