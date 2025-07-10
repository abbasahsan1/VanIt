import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { FaHome, FaBus, FaUser, FaUsers, FaEdit, FaSignOutAlt, FaSave } from "react-icons/fa";

const EditCaptain = () => {
  const [captains, setCaptains] = useState([]);
  const [editingCaptain, setEditingCaptain] = useState(null);
  const [updatedData, setUpdatedData] = useState({});

  // ✅ Fetch Captains Data
  useEffect(() => {
    const fetchCaptains = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/admin/captains");
        setCaptains(response.data);
      } catch (error) {
        console.error("❌ Error fetching captains:", error);
      }
    };
    fetchCaptains();
  }, []);

  // ✅ Open Edit Form
  const handleEditClick = (captain) => {
    if (!captain.first_name) {
      console.error("❌ Captain First Name is missing!");
      return;
    }
    setEditingCaptain(captain);
    setUpdatedData(captain); // Fill form with selected captain data
  };

  // ✅ Handle Input Change
  const handleChange = (e) => {
    setUpdatedData({ ...updatedData, [e.target.name]: e.target.value });
  };

  // ✅ Submit Updated Data
  const handleUpdate = async () => {
    if (!editingCaptain || !editingCaptain.first_name) {
      console.error("❌ Captain First Name is missing!");
      return;
    }

    try {
      const response = await axios.put(
        `http://localhost:5000/api/admin/captains/update/${editingCaptain.first_name}`,
        updatedData
      );

      console.log("✅ Captain Updated:", response.data);
      alert("Captain updated successfully!");

      // Update Captain List Without Reloading
      setCaptains((prevCaptains) =>
        prevCaptains.map((captain) =>
          captain.first_name === editingCaptain.first_name ? updatedData : captain
        )
      );

      setEditingCaptain(null); // Close the edit form
    } catch (error) {
      console.error("❌ Error updating captain:", error);
      alert("Error updating captain.");
    }
  };

  // ✅ Logout Function
  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen bg-[#B3D9FF] flex flex-col">
      
      {/* ✅ Navigation Bar */}
      <nav className="bg-white p-4 shadow-md flex justify-between items-center">
        <div className="flex items-center">
          <h1 className="text-orange-600 font-bold text-lg">
            Capital University of Science and Technology
          </h1>
        </div>
        <div className="flex space-x-8 text-blue-600 font-semibold text-lg">
          <Link to="/dashboard" className="hover:text-blue-800 flex items-center">
            <FaHome className="mr-1" /> Home
          </Link>
          <Link to="/routes" className="hover:text-blue-800 flex items-center">
            <FaBus className="mr-1" /> Routes
          </Link>
          <Link to="/captain-list" className="hover:text-blue-800 flex items-center">
            <FaUser className="mr-1" /> Captain List
          </Link>
          <Link to="/student-list" className="hover:text-blue-800 flex items-center">
            <FaUsers className="mr-1" /> Student List
          </Link>

          {/* ✅ Manage Captain Dropdown */}
          <div className="relative group">
            <button className="hover:text-blue-800 flex items-center">
              <FaUsers className="mr-1" /> Manage Captain ▼
            </button>
            <div className="absolute hidden group-hover:block bg-white shadow-md rounded-lg p-2 w-40">
              <Link to="/edit-captain" className="block p-2 hover:bg-gray-200">
                <FaEdit className="mr-2" /> Edit Captain
              </Link>
            </div>
          </div>

          <button onClick={handleLogout} className="hover:text-red-600 flex items-center">
            <FaSignOutAlt className="mr-1" /> Logout
          </button>
        </div>
      </nav>

      {/* ✅ Captain List Table */}
      <div className="p-10">
        <div className="bg-white shadow-lg rounded-lg p-6">
          <h1 className="text-2xl font-bold text-blue-600 mb-4">Edit Captain</h1>

          {captains.length === 0 ? (
            <p className="text-gray-500">No captains available for editing.</p>
          ) : (
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-200">
                  <th className="border border-gray-300 p-2">First Name</th>
                  <th className="border border-gray-300 p-2">Last Name</th>
                  <th className="border border-gray-300 p-2">Email</th>
                  <th className="border border-gray-300 p-2">Phone</th>
                  <th className="border border-gray-300 p-2">Route</th>
                  <th className="border border-gray-300 p-2">Bus No.</th>
                  <th className="border border-gray-300 p-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {captains.map((captain, index) => (
                  <tr key={index} className="text-center">
                    <td className="border border-gray-300 p-2">{captain.first_name}</td>
                    <td className="border border-gray-300 p-2">{captain.last_name}</td>
                    <td className="border border-gray-300 p-2">{captain.email}</td>
                    <td className="border border-gray-300 p-2">{captain.phone}</td>
                    <td className="border border-gray-300 p-2">{captain.route_name}</td>
                    <td className="border border-gray-300 p-2">{captain.bus_no}</td>
                    <td className="border border-gray-300 p-2">
                      <button 
                        onClick={() => handleEditClick(captain)} 
                        className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-700"
                      >
                        <FaEdit />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ✅ Edit Captain Modal */}
      {editingCaptain && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96">
            <h2 className="text-xl font-bold mb-4 text-blue-600">Edit Captain</h2>
            <input 
              type="text" 
              name="first_name" 
              value={updatedData.first_name} 
              onChange={handleChange} 
              className="w-full p-2 border rounded mb-3" 
            />
            <input 
              type="text" 
              name="last_name" 
              value={updatedData.last_name} 
              onChange={handleChange} 
              className="w-full p-2 border rounded mb-3" 
            />
            <input 
              type="text" 
              name="phone" 
              value={updatedData.phone} 
              onChange={handleChange} 
              className="w-full p-2 border rounded mb-3" 
            />
            <button 
              onClick={handleUpdate} 
              className="bg-green-500 text-white px-4 py-2 rounded mr-3 hover:bg-green-700"
            >
              <FaSave /> Save
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditCaptain;
