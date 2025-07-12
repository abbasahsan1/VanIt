import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaUserCircle, FaQrcode, FaRedo, FaPlay, FaExclamationTriangle } from 'react-icons/fa';
import axios from 'axios';
import { io } from 'socket.io-client';

const AdminAttendanceManager = () => {
  const navigate = useNavigate();
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [qrCodeData, setQrCodeData] = useState(null);
  const [selectedRoute, setSelectedRoute] = useState('');
  const [routes, setRoutes] = useState([]);
  const [socket, setSocket] = useState(null);
  const [stats, setStats] = useState({
    totalAttended: 0,
    totalRegistered: 0,
    activeSessions: 0,
    attendanceRate: 0
  });
  const [activeSessions, setActiveSessions] = useState([]);

  useEffect(() => {
    initializeData();
    setupSocket();
    
    // Set up automatic refresh every 10 seconds for real-time updates
    const refreshInterval = setInterval(() => {
      console.log('🔄 Auto-refreshing active sessions...');
      fetchActiveSessions();
    }, 10000);

    return () => {
      clearInterval(refreshInterval);
    };
  }, []);

  const setupSocket = () => {
    const newSocket = io('http://localhost:5000');
    
    newSocket.on('connect', () => {
      console.log('Admin connected to WebSocket');
      newSocket.emit('subscribe_admin');
    });

    newSocket.on('boarding_update', (data) => {
      console.log('Received boarding update:', data);
      fetchActiveSessions(); // Refresh sessions when updates occur
      fetchStats(); // Refresh stats
    });

    newSocket.on('student_onboarded', (data) => {
      console.log('Received student onboarded:', data);
      fetchActiveSessions();
      fetchStats();
    });

    newSocket.on('session_ended', (data) => {
      console.log('Session ended:', data);
      fetchActiveSessions();
      fetchStats();
    });

    newSocket.on('attendance_update', (data) => {
      console.log('Received attendance update:', data);
      fetchActiveSessions();
      fetchStats();
    });

    setSocket(newSocket);

    return () => {
      newSocket?.disconnect();
    };
  };

  const initializeData = async () => {
    try {
      setPageLoading(true);
      setError(null);
      
      const token = localStorage.getItem('adminToken');
      if (!token) {
        navigate('/login');
        return;
      }

      // Fetch routes, stats, and sessions
      await Promise.all([
        fetchRoutes(),
        fetchStats(),
        fetchActiveSessions()
      ]);

      setPageLoading(false);
    } catch (error) {
      console.error('Error initializing data:', error);
      setError('Failed to load attendance data. Please refresh the page.');
      setPageLoading(false);
    }
  };

  const fetchRoutes = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/routes');
      if (response.data && typeof response.data === 'object') {
        const routeList = Object.keys(response.data).map(routeName => ({
          name: routeName,
          stops: response.data[routeName] || []
        }));
        setRoutes(routeList);
      }
    } catch (error) {
      console.error('Error fetching routes:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/attendance/statistics');
      if (response.data.success) {
        const totalRegistered = response.data.data.uniqueStudents || 0;
        const totalAttended = response.data.data.totalScans || 0;
        
        // Calculate attendance rate properly: (Students who attended / Total registered) × 100
        // Ensure it never exceeds 100%
        let attendanceRate = 0;
        if (totalRegistered > 0) {
          attendanceRate = Math.min(100, Math.round((totalAttended / totalRegistered) * 100 * 100) / 100); // Round to 2 decimal places
        }
        
        setStats({
          totalAttended: totalAttended,
          totalRegistered: totalRegistered,
          activeSessions: response.data.data.activeSessions || 0,
          attendanceRate: attendanceRate
        });
        
        console.log(`📊 Updated stats - Attended: ${totalAttended}, Registered: ${totalRegistered}, Rate: ${attendanceRate}%`);
      }
    } catch (error) {
      console.warn('Stats loading failed:', error);
    }
  };

  const fetchActiveSessions = async () => {
    try {
      console.log('🔄 Fetching active sessions...');
      const token = localStorage.getItem('adminToken');
      const response = await axios.get('http://localhost:5000/api/admin/attendance/active-sessions', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      console.log('📊 Active sessions response:', response.data);
      
      if (response.data.success && Array.isArray(response.data.data)) {
        setActiveSessions(response.data.data);
        console.log(`✅ Found ${response.data.data.length} active sessions:`, response.data.data);
      } else {
        console.warn('❌ Active sessions response format unexpected:', response.data);
        setActiveSessions([]);
      }
    } catch (error) {
      console.error('❌ Sessions loading failed:', error.response?.data || error.message);
      setActiveSessions([]);
    }
  };

  const generateQRCode = async () => {
    if (!selectedRoute) {
      alert('Please select a route first');
      return;
    }

    try {
      setLoading(true);
      
      const response = await axios.post(
        `http://localhost:5000/api/attendance/generate-qr/${encodeURIComponent(selectedRoute)}`
      );
      
      if (response.data.success) {
        setQrCodeData(response.data.data);
        alert('QR Code generated successfully!');
      }
    } catch (error) {
      console.error('Error generating QR code:', error);
      alert('Failed to generate QR code: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const refreshActiveSessions = async () => {
    await fetchActiveSessions();
  };

  const handleLogout = () => {
    socket?.disconnect();
    localStorage.removeItem('adminToken');
    navigate('/login');
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-[#B3D9FF] flex flex-col">
      
      {/* Navigation Bar */}
      <nav className="bg-white p-4 shadow-md flex justify-between items-center">
        <div className="flex items-center">
          <img src="/2.png" alt="Logo" className="w-12 h-12 mr-3" />
          <h1 className="text-2xl font-bold text-orange-500">VAN<span className="text-blue-700">it!</span></h1>
        </div>
        
        <div className="flex items-center space-x-4">
          <Link 
            to="/dashboard" 
            className="text-blue-700 hover:text-blue-900 font-medium"
          >
            Dashboard
          </Link>
          <div className="relative group">
            <FaUserCircle className="text-3xl text-blue-700 cursor-pointer" />
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
              <button
                onClick={handleLogout}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Loading State */}
      {pageLoading && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-blue-700 text-lg">Loading attendance data...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && !pageLoading && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <FaExclamationTriangle className="text-6xl text-red-500 mx-auto mb-4" />
            <p className="text-red-600 text-lg mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      {!pageLoading && !error && (
        <div className="p-8 flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Stats Cards */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Total Attended Today</h3>
              <p className="text-3xl font-bold text-blue-600">{stats.totalAttended}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Total Registered</h3>
              <p className="text-3xl font-bold text-green-600">{stats.totalRegistered}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Active Sessions</h3>
              <p className="text-3xl font-bold text-orange-600">{activeSessions.length}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibent text-gray-700 mb-2">Attendance Rate</h3>
              <p className="text-3xl font-bold text-purple-600">{stats.attendanceRate}%</p>
            </div>
          </div>

          {/* QR Code Generation */}
          <div className="bg-white p-6 rounded-lg shadow mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">Generate QR Code</h2>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Route
              </label>
              <select
                value={selectedRoute}
                onChange={(e) => setSelectedRoute(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Choose a route...</option>
                {routes.map((route, index) => (
                  <option key={index} value={route.name}>
                    {route.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={generateQRCode}
              disabled={loading || !selectedRoute}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg disabled:opacity-50 flex items-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Generating...
                </>
              ) : (
                <>
                  <FaQrcode className="mr-2" />
                  Generate QR for {selectedRoute || 'Route'}
                </>
              )}
            </button>
            
            {qrCodeData && (
              <div className="text-center mt-4">
                <div className="bg-white p-4 border-2 border-dashed border-gray-300 rounded-lg inline-block">
                  <img 
                    src={qrCodeData.qrImage} 
                    alt={`QR Code for ${qrCodeData.routeName}`}
                    className="mx-auto mb-2"
                    style={{ width: '200px', height: '200px' }}
                  />
                  <p className="text-sm text-gray-600 mb-2">QR Code for {qrCodeData.routeName}</p>
                  <p className="text-xs text-gray-500 mb-1">Generated: {new Date(qrCodeData.generatedAt).toLocaleString()}</p>
                  <p className="text-xs text-gray-500">Students can scan this to mark attendance</p>
                  <button
                    onClick={async () => {
                      try {
                        const response = await axios.get(
                          `http://localhost:5000/api/attendance/download-qr/${encodeURIComponent(qrCodeData.routeName)}`,
                          { responseType: 'blob' }
                        );
                        
                        const blob = new Blob([response.data], { type: 'image/png' });
                        const url = window.URL.createObjectURL(blob);
                        const link = document.createElement('a');
                        link.href = url;
                        link.download = `${qrCodeData.routeName}-qr-code.png`;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        window.URL.revokeObjectURL(url);
                      } catch (error) {
                        console.error('Error downloading QR code:', error);
                        alert('Failed to download QR code');
                      }
                    }}
                    className="mt-2 bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
                  >
                    Download QR Code
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Active Sessions */}
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">Active Boarding Sessions</h2>
              <button
                onClick={refreshActiveSessions}
                className="text-blue-600 hover:text-blue-800 flex items-center"
              >
                <FaRedo className="text-lg mr-1" />
                Refresh
              </button>
            </div>
            
            {activeSessions.length === 0 ? (
              <div className="text-center py-8">
                <FaPlay className="text-4xl text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600">No active boarding sessions</p>
                <p className="text-sm text-gray-500">Sessions will appear here when captains start boarding</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Route
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Captain
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Started At
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Students Count
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {activeSessions.map((session) => (
                      <tr key={session.session_id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {session.route_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {session.captain_first_name} {session.captain_last_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatTime(session.session_start)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {session.students_onboard || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <FaPlay className="mr-1" />
                            Active
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAttendanceManager;
