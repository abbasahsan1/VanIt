import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  FaUser,
  FaHome,
  FaList,
  FaSignOutAlt,
  FaPlus,
  FaEdit,
  FaCaretDown,
} from "react-icons/fa";

const CaptainList = () => {
  const [captains, setCaptains] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();
  const [routes, setRoutes] = useState([]);

  // ✅ Fetch Captains from API
  useEffect(() => {
    const fetchCaptains = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/admin/captains");
        console.log("✅ Captains API Response:", response.data);
        setCaptains(response.data);
      } catch (error) {
        console.error("❌ Error fetching captains:", error);
      }
    };
    fetchCaptains();
    
    const fetchRoutes = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/routes/all");
        setRoutes(res.data);
      } catch (error) {
        console.error("❌ Error fetching routes:", error);
      }
    };
    fetchRoutes();
    
  }, []);

  // ✅ Handle Logout
  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    navigate("/");
  };

  const handleAssignRoute = async (captainPhone, routeName) => {
    try {
      await axios.put("http://localhost:5000/api/admin/assign-route", {
        phone: captainPhone,
        routeName,
      });
      alert("✅ Route assigned successfully");
      window.location.reload();
    } catch (err) {
      console.error("❌ Error assigning route:", err);
      alert("Failed to assign route");
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
            <FaList className="mr-1" /> Routes
          </Link>
          <Link to="/student-list" className="hover:text-blue-800 flex items-center">
            <FaUser className="mr-1" /> Student List
          </Link>

          {/* ✅ Manage Captain Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center hover:text-blue-800"
            >
              <FaUser className="mr-1" /> Manage Captain <FaCaretDown className="ml-1" />
            </button>
            {showDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-white border shadow-lg rounded-lg">
                <Link to="/add-captain" className="block px-4 py-2 hover:bg-gray-200">
                  <FaPlus className="mr-2" /> Add Captain
                </Link>
                <Link to="/edit-captain" className="block px-4 py-2 hover:bg-gray-200">
                  <FaEdit className="mr-2" /> Edit Captain
                </Link>
                <Link to="/delete-captain" className="block px-4 py-2 hover:bg-gray-200">
                  <FaEdit className="mr-2" /> Delete Captain
                </Link>
              </div>
            )}
          </div>

          <button onClick={handleLogout} className="hover:text-blue-800 flex items-center">
            <FaSignOutAlt className="mr-1" /> Logout
          </button>
        </div>
      </nav>

      {/* ✅ Captain List Table */}
      <div className="p-10">
        <div className="bg-white shadow-lg rounded-lg p-6">
          <h1 className="text-2xl font-bold text-blue-600 mb-4">Captain List</h1>

          {captains.length === 0 ? (
            <p className="text-gray-500">No captains found.</p>
          ) : (
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-blue-500 text-white">
                  <th className="p-3 border">Name</th>
                  <th className="p-3 border">Phone</th>
                  <th className="p-3 border">Email</th>
                  <th className="p-3 border">Assigned Route</th>
                </tr>
              </thead>
              <tbody>
                {captains.map((captain, index) => (
                  
                  <tr key={index} className="bg-gray-100 hover:bg-gray-200">
                    <td className="p-3 border">{`${captain.first_name} ${captain.last_name}`}</td>
                    <td className="p-3 border">{captain.phone}</td>
                    <td className="p-3 border">{captain.email}</td>
                    <td className="p-3 border">
                    

                    <select
  value={captain.route_name || ""}
  onChange={(e) => handleAssignRoute(captain.phone, e.target.value)}
  className="p-2 border rounded"
>

    <option value="">Assign Route</option>
    {routes.map((route) => (
      <option key={route.id} value={route.route_name}>
        {route.route_name}
      </option>
    ))}
  </select>
</td>

                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default CaptainList;
