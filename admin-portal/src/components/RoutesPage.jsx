import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { FaUserCircle, FaMapMarkedAlt, FaPlus, FaTrash, FaEdit, FaHome } from "react-icons/fa";

const RoutesPage = () => {
  const [routes, setRoutes] = useState([]); // Default to an empty array
  const navigate = useNavigate();

  // Fetch routes from API
  useEffect(() => {
    const fetchRoutes = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/routes");
        console.log("API Response:", response.data);

        if (typeof response.data === "object" && response.data !== null) {
          // Convert object data into array format
          const formattedRoutes = Object.keys(response.data).map(routeName => ({
            route_name: routeName,
            stops: response.data[routeName] || [], // ✅ Ensure stops always exist
          }));

          setRoutes(formattedRoutes);
        } else {
          setRoutes([]);
        }
      } catch (error) {
        console.error("Error fetching routes:", error);
        setRoutes([]);
      }
    };

    fetchRoutes();
  }, []);

  // Logout function
  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    navigate("/");
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
          <Link to="/student-list" className="hover:text-blue-800">Students List</Link>
          <Link to="/create-route" className="hover:text-blue-800 flex items-center">
            <FaPlus className="mr-1" /> Add Routes
          </Link>
          <Link to="/delete-route" className="hover:text-blue-800 flex items-center">
            <FaTrash className="mr-1" /> Delete Routes
          </Link>
          <Link to="/edit-route" className="hover:text-blue-800 flex items-center">
            <FaEdit className="mr-1" /> Edit Routes
          </Link>
          <button onClick={handleLogout} className="hover:text-blue-800">Logout</button>
        </div>
        <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
          <FaUserCircle className="text-gray-600 text-2xl" />
        </div>
      </nav>

      {/* ✅ Routes List */}
      <div className="p-10">
        <div className="bg-white shadow-lg rounded-lg p-6">
          <h1 className="text-2xl font-bold text-blue-600 mb-4 flex items-center">
            <FaMapMarkedAlt className="mr-2" /> Routes List
          </h1>

          {/* ✅ Handle Empty Routes Case */}
          {routes.length === 0 ? (
            <p className="text-gray-500">No routes added yet.</p>
          ) : (
            <ul className="space-y-4">
              {routes.map((route, index) => (
                <li key={index} className="p-4 bg-[#7DB4E6] shadow-md rounded-lg flex flex-col">
                  <h2 className="text-lg font-semibold text-white">{route.route_name}</h2>
                  <p className="text-gray-100">
                    Stops: {route.stops.length > 0 
                      ? route.stops.map(stop => stop.stop_name).join(", ") 
                      : "No stops added"}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default RoutesPage;
