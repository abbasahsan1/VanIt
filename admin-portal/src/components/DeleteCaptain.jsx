import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  FaHome,
  FaBus,
  FaUser,
  FaUsers,
  FaTrash,
  FaSignOutAlt,
  FaExclamationTriangle,
  FaCaretDown,
} from "react-icons/fa";

const DeleteCaptain = () => {
  const [captains, setCaptains] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [captainToDelete, setCaptainToDelete] = useState(null);
  const navigate = useNavigate();

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

  // ✅ Open Delete Confirmation Modal
  const handleDeleteClick = (captain) => {
    setCaptainToDelete(captain);
  };

  // ✅ Confirm and Delete Captain
  const confirmDelete = async () => {
    if (!captainToDelete) return;

    try {
      const response = await axios.delete(
        `http://localhost:5000/api/admin/captains/delete/${captainToDelete.first_name}`
      );

      console.log("✅ Captain Deleted:", response.data);
      alert("Captain deleted successfully!");

      // Remove captain from the list immediately
      setCaptains(captains.filter((c) => c.first_name !== captainToDelete.first_name));
      setCaptainToDelete(null); // Close modal
    } catch (error) {
      console.error("❌ Error deleting captain:", error);
      alert("Error deleting captain.");
    }
  };

  // ✅ Logout Function
  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    navigate("/");
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
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center hover:text-blue-800"
            >
              <FaUser className="mr-1" /> Manage Captain <FaCaretDown className="ml-1" />
            </button>
            {showDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-white border shadow-lg rounded-lg">
                <Link to="/delete-captain" className="block px-4 py-2 hover:bg-gray-200">
                  <FaTrash className="mr-2" /> Delete Captain
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
          <h1 className="text-2xl font-bold text-blue-600 mb-4">Delete Captain</h1>

          {captains.length === 0 ? (
            <p className="text-gray-500">No captains available for deletion.</p>
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
                        onClick={() => handleDeleteClick(captain)}
                        className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-700"
                      >
                        <FaTrash />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ✅ Delete Confirmation Modal */}
      {captainToDelete && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96">
            <h2 className="text-xl font-bold mb-4 text-red-600 flex items-center">
              <FaExclamationTriangle className="mr-2" /> Confirm Deletion
            </h2>
            <p>Are you sure you want to delete {captainToDelete.first_name}?</p>
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setCaptainToDelete(null)}
                className="bg-gray-400 text-white px-4 py-2 rounded mr-3 hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeleteCaptain;
