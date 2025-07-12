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
  FaSatellite,
  FaQrcode
} from "react-icons/fa";
import axios from "axios";
import io from "socket.io-client";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [emergencyAlerts, setEmergencyAlerts] = useState([]);
  const [dashboardStats, setDashboardStats] = useState({
    totalBuses: 0,
    totalCaptains: 0,
    totalRoutes: 0,
    activeBuses: 0,
    activeCaptains: 0,
    activeRoutes: 0
  });
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);

  // Initialize WebSocket connection for real-time updates
  useEffect(() => {
    const newSocket = io('http://localhost:5000');
    
    newSocket.on('connect', () => {
      console.log('✅ Admin Dashboard WebSocket connected');
      newSocket.emit('subscribe_admin');
    });

    newSocket.on('emergency_alert', (data) => {
      console.log('🚨 Real-time emergency alert received:', data);
      setEmergencyAlerts(prevAlerts => [data.data, ...prevAlerts.slice(0, 4)]); // Keep latest 5
      
      // Show browser notification
      if (Notification.permission === 'granted') {
        new Notification('🚨 Emergency Alert', {
          body: `${data.data.user_type.toUpperCase()}: ${data.data.first_name} ${data.data.last_name} - ${data.data.emergency_type}`,
          icon: '/favicon.ico'
        });
      }
    });

    newSocket.on('dashboard_stats_update', (updatedStats) => {
      console.log('📊 Real-time dashboard stats update:', updatedStats);
      setDashboardStats(prevStats => ({
        ...prevStats,
        ...updatedStats
      }));
    });

    newSocket.on('captain_status_change', (data) => {
      console.log('👨‍✈️ Captain status changed:', data);
      fetchDashboardStats(); // Refresh stats when captain status changes
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  // Fetch real-time dashboard statistics
  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      
      // Fetch all data in parallel for better performance
      const [busesRes, captainsRes, routesRes, activeCaptainsRes, activeSessionsRes] = await Promise.all([
        axios.get('http://localhost:5000/api/admin/buses/count'),
        axios.get('http://localhost:5000/api/admin/captains'),
        axios.get('http://localhost:5000/api/routes/all'),
        axios.get('http://localhost:5000/api/admin/captains/active'),
        axios.get('http://localhost:5000/api/attendance/active-sessions')
      ]);

      // Calculate active routes from active sessions
      const activeSessions = activeSessionsRes.data.success ? activeSessionsRes.data.data : [];
      const activeRoutes = [...new Set(activeSessions.map(session => session.route_name))].length;

      const stats = {
        totalBuses: busesRes.data.count || 0,
        totalCaptains: captainsRes.data.data ? captainsRes.data.data.length : 0,
        totalRoutes: routesRes.data ? routesRes.data.length : 0,
        activeBuses: activeSessions.length, // Active buses = active sessions
        activeCaptains: activeCaptainsRes.data.data ? activeCaptainsRes.data.data.length : 0,
        activeRoutes: activeRoutes
      };

      setDashboardStats(stats);
      
      console.log('📊 Dashboard stats updated:', stats);
      
    } catch (error) {
      console.error("❌ Error fetching dashboard stats:", error);
      // Set fallback values
      setDashboardStats({
        totalBuses: 0,
        totalCaptains: 0,
        totalRoutes: 0,
        activeBuses: 0,
        activeCaptains: 0,
        activeRoutes: 0
      });
    } finally {
      setLoading(false);
    }
  };

  // ✅ Fetch Emergency Alerts from Backend
  const fetchEmergencyAlerts = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/emergency/admin/alerts?status=pending&limit=5");
      if (response.data.success) {
        setEmergencyAlerts(response.data.data);
      }
    } catch (error) {
      console.error("❌ Error fetching alerts:", error);
      setEmergencyAlerts([]);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchDashboardStats();
    fetchEmergencyAlerts();
    
    // Request notification permission
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
    
    // Set up periodic refresh every 30 seconds
    const interval = setInterval(() => {
      fetchDashboardStats();
      fetchEmergencyAlerts();
    }, 30000);
    
    return () => clearInterval(interval);
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
          <Link to="/emergency-management" className="hover:text-red-600 text-red-500 font-bold">🚨 Emergency</Link>
          <button onClick={handleLogout} className="hover:text-blue-800">Logout</button>
        </div>
        <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
          <FaUserCircle className="text-gray-600 text-2xl" />
        </div>
      </nav>

      {/* 🚨 Emergency Alerts Popup */}
      {emergencyAlerts.length > 0 && (
        <div className="fixed top-10 right-10 bg-red-600 text-white p-4 rounded-lg shadow-lg max-w-sm">
          <h2 className="text-lg font-bold flex items-center mb-3">
            <FaExclamationTriangle className="mr-2" /> Emergency Alerts ({emergencyAlerts.length})
          </h2>
          {emergencyAlerts.slice(0, 3).map((alert, index) => (
            <div key={index} className="mt-2 p-2 bg-red-500 rounded">
              <p><strong>Name:</strong> {alert.first_name} {alert.last_name}</p>
              <p><strong>Type:</strong> {alert.user_type}</p>
              <p><strong>Route:</strong> {alert.route_name}</p>
              <p><strong>Priority:</strong> {alert.priority_level?.toUpperCase()}</p>
              <button 
                className="bg-gray-800 text-white px-2 py-1 rounded mt-2 mr-2"
                onClick={() => removeAlert(index)}
              >
                Dismiss
              </button>
            </div>
          ))}
          {emergencyAlerts.length > 3 && (
            <p className="text-sm text-red-200 mt-2">... and {emergencyAlerts.length - 3} more alerts</p>
          )}
          <div className="mt-3 pt-3 border-t border-red-400">
            <Link 
              to="/emergency-management"
              className="block w-full text-center bg-white text-red-600 px-3 py-2 rounded font-semibold hover:bg-gray-100 transition-colors"
            >
              Manage All Alerts
            </Link>
          </div>
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
                <p className="text-2xl font-bold text-blue-800">
                  {loading ? '...' : dashboardStats.totalBuses}
                </p>
              </div>
              <FaBus className="text-blue-800 text-3xl" />
            </div>

            {/* Card: Total Captains */}
            <div className="bg-[#7DB4E6] p-6 rounded-lg shadow-lg flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-orange-600">Total Captains</h2>
                <p className="text-2xl font-bold text-blue-800">
                  {loading ? '...' : dashboardStats.totalCaptains}
                </p>
              </div>
              <FaUserTie className="text-blue-800 text-3xl" />
            </div>

            {/* Card: Total Routes */}
            <div className="bg-[#7DB4E6] p-6 rounded-lg shadow-lg flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-orange-600">Total Routes</h2>
                <p className="text-2xl font-bold text-blue-800">
                  {loading ? '...' : dashboardStats.totalRoutes}
                </p>
              </div>
              <FaMapMarkedAlt className="text-blue-800 text-3xl" />
            </div>

            {/* Card: Active Buses */}
            <div className="bg-[#5392C9] p-6 rounded-lg shadow-lg flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-orange-600">Active Buses</h2>
                <p className="text-2xl font-bold text-white">
                  {loading ? '...' : dashboardStats.activeBuses}
                </p>
              </div>
              <FaBus className="text-blue-900 text-3xl" />
            </div>

            {/* Card: Active Captains */}
            <div className="bg-[#5392C9] p-6 rounded-lg shadow-lg flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-orange-600">Active Captains</h2>
                <p className="text-2xl font-bold text-white">
                  {loading ? '...' : dashboardStats.activeCaptains}
                </p>
              </div>
              <FaUserTie className="text-blue-900 text-3xl" />
            </div>

            {/* Card: Active Routes */}
            <div className="bg-[#5392C9] p-6 rounded-lg shadow-lg flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-orange-600">Active Routes</h2>
                <p className="text-2xl font-bold text-white">
                  {loading ? '...' : dashboardStats.activeRoutes}
                </p>
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

            {/* Card: Attendance Management */}
            <Link to="/attendance-management" className="bg-[#FF6B35] p-6 rounded-lg shadow-lg flex justify-between items-center hover:bg-[#E5531A] transition-colors">
              <div>
                <h2 className="text-xl font-bold text-white">Attendance Management</h2>
                <p className="text-orange-100 text-sm">QR codes & reports</p>
              </div>
              <FaQrcode className="text-white text-3xl" />
            </Link>

            {/* Card: Emergency Management */}
            <Link to="/emergency-management" className="bg-[#DC2626] p-6 rounded-lg shadow-lg flex justify-between items-center hover:bg-[#B91C1C] transition-colors">
              <div>
                <h2 className="text-xl font-bold text-white">🚨 Emergency Management</h2>
                <p className="text-red-100 text-sm">Monitor & respond to SOS alerts</p>
              </div>
              <FaExclamationTriangle className="text-white text-3xl" />
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
