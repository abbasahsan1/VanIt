import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  FaBus, 
  FaUserTie, 
  FaMapMarkedAlt, 
  FaHeadset, 
  FaMapPin, 
  FaUserCircle, 
  FaExclamationTriangle,
  FaSatellite
} from "react-icons/fa";
import axios from "axios";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [emergencyAlerts, setEmergencyAlerts] = useState([]);

  // ✅ Fetch Emergency Alerts from Backend
  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/admin/emergency-alerts");
        setEmergencyAlerts(response.data);
      } catch (error) {
        console.error("❌ Error fetching alerts:", error);
      }
    };

    fetchAlerts();
  }, []);

  // ✅ Handle Logout
  const handleLogout = () => {
    localStorage.removeItem("adminToken"); // Clear token
    navigate("/"); // Redirect to login
  };

  // ✅ Remove Alert from List
  const removeAlert = (index) => {
    setEmergencyAlerts((prevAlerts) => prevAlerts.filter((_, i) => i !== index));
  };

  return (
    <div className="min-h-screen bg-[#B3D9FF] flex flex-col">
      
      {/* Navigation Bar */}
      <nav className="bg-white p-4 shadow-md flex justify-between items-center">
        <div className="flex items-center">
          <img src="/2.png" alt="Logo" className="w-12 h-12 mr-3" />
          <h1 className="text-orange-600 font-bold text-lg">
            Capital University of Science and Technology
          </h1>
        </div>
        <div className="flex space-x-8 text-blue-600 font-semibold text-lg">
          <Link to="/dashboard" className="hover:text-blue-800">Home</Link>
          <Link to="/routes" className="hover:text-blue-800">Routes</Link>
          <Link to="/captain-list" className="hover:text-blue-800">Captain List</Link>
          <Link to="/student-list" className="hover:text-blue-800">Students List</Link>
          <Link to="/route-monitor" className="hover:text-blue-800">Route Monitor</Link>
          <button onClick={handleLogout} className="hover:text-blue-800">Logout</button>
        </div>
        <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
          <FaUserCircle className="text-gray-600 text-2xl" />
        </div>
      </nav>

      {/* 🚨 Emergency Alerts Popup */}
      {emergencyAlerts.length > 0 && (
        <div className="fixed top-10 right-10 bg-red-600 text-white p-4 rounded-lg shadow-lg">
          <h2 className="text-lg font-bold flex items-center">
            <FaExclamationTriangle className="mr-2" /> Emergency Alerts
          </h2>
          {emergencyAlerts.map((alert, index) => (
            <div key={index} className="mt-2 p-2 bg-red-500 rounded">
              <p><strong>Name:</strong> {alert.first_name} {alert.last_name}</p>
              <p><strong>Reg #:</strong> {alert.registration_number}</p>
              <p><strong>Location:</strong> {alert.location}</p>
              <button 
                className="bg-gray-800 text-white px-2 py-1 rounded mt-2"
                onClick={() => removeAlert(index)}
              >
                Dismiss
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Dashboard Section */}
      <div className="p-10">
        <div className="bg-white shadow-lg rounded-lg p-6">
          
          {/* Grid Layout for Cards */}
          <div className="grid grid-cols-3 gap-6">
            
            {/* Card: Total Buses */}
            <div className="bg-[#7DB4E6] p-6 rounded-lg shadow-lg flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-orange-600">Total Buses</h2>
              </div>
              <FaBus className="text-blue-800 text-3xl" />
            </div>

            {/* Card: Total Captains */}
            <div className="bg-[#7DB4E6] p-6 rounded-lg shadow-lg flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-orange-600">Total Captains</h2>
              </div>
              <FaUserTie className="text-blue-800 text-3xl" />
            </div>

            {/* Card: Total Routes */}
            <div className="bg-[#7DB4E6] p-6 rounded-lg shadow-lg flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-orange-600">Total Routes</h2>
              </div>
              <FaMapMarkedAlt className="text-blue-800 text-3xl" />
            </div>

            {/* Card: Active Buses */}
            <div className="bg-[#5392C9] p-6 rounded-lg shadow-lg flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-orange-600">Active Buses</h2>
              </div>
              <FaBus className="text-blue-900 text-3xl" />
            </div>

            {/* Card: Active Captains */}
            <div className="bg-[#5392C9] p-6 rounded-lg shadow-lg flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-orange-600">Active Captains</h2>
              </div>
              <FaUserTie className="text-blue-900 text-3xl" />
            </div>

            {/* Card: Active Routes */}
            <div className="bg-[#5392C9] p-6 rounded-lg shadow-lg flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-orange-600">Active Routes</h2>
              </div>
              <FaMapPin className="text-blue-900 text-3xl" />
            </div>

            {/* Card: Route Monitor */}
            <Link to="/route-monitor" className="bg-[#4A90E2] p-6 rounded-lg shadow-lg flex justify-between items-center hover:bg-[#357ABD] transition-colors">
              <div>
                <h2 className="text-xl font-bold text-white">Route Monitor</h2>
                <p className="text-blue-100 text-sm">Real-time GPS tracking</p>
              </div>
              <FaSatellite className="text-white text-3xl" />
            </Link>

            {/* Card: Student Feedbacks */}
            <Link to="/admin-feedbacks" className="bg-[#4A90E2] p-6 rounded-lg shadow-lg flex justify-between items-center hover:bg-[#357ABD] transition-colors">
              <div>
                <h2 className="text-xl font-bold text-white">Student Feedbacks</h2>
                <p className="text-blue-100 text-sm">View feedback</p>
              </div>
              <FaHeadset className="text-white text-3xl" />
            </Link>

          </div>
        </div>
      </div>

      {/* Floating Support Button */}
      <div className="fixed bottom-4 right-4 bg-orange-500 p-4 rounded-full shadow-lg cursor-pointer">
        <FaHeadset className="text-white text-2xl" />
      </div>
      
    </div>
  );
};

export default AdminDashboard;
