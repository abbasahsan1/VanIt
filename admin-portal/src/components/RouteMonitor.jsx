import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { io } from 'socket.io-client';
import { 
  FaMapMarkedAlt, 
  FaUserCircle, 
  FaHome, 
  FaBus, 
  FaClock,
  FaMapPin,
  FaUsers,
  FaSync
} from 'react-icons/fa';

const RouteMonitor = () => {
  const navigate = useNavigate();
  const [routes, setRoutes] = useState([]);
  const [selectedRoute, setSelectedRoute] = useState('');
  const [captainLocations, setCaptainLocations] = useState([]);
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [activeSessions, setActiveSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const mapRef = useRef(null);
  const markersRef = useRef({});

  useEffect(() => {
    const newSocket = io('http://localhost:5000');
    
    newSocket.on('connect', () => {
      console.log('Connected to WebSocket server');
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from WebSocket server');
      setIsConnected(false);
    });

    newSocket.on('location_update', (data) => {
      console.log('Received location update:', data);
      updateCaptainLocation(data);
    });

    // Listen for attendance updates to get real student counts
    newSocket.on('attendance_update', (data) => {
      console.log('Received attendance update:', data);
      updateStudentCount(data);
    });

    // Listen for session updates
    newSocket.on('session_ended', (data) => {
      console.log('Session ended:', data);
      fetchActiveSessions();
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  useEffect(() => {
    const fetchRoutes = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/routes');
        if (response.data && typeof response.data === 'object') {
          const formattedRoutes = Object.keys(response.data).map(routeName => ({
            route_name: routeName,
            stops: response.data[routeName] || []
          }));
          setRoutes(formattedRoutes);
        }
      } catch (error) {
        console.error('Error fetching routes:', error);
      }
    };

    fetchRoutes();
  }, []);

  const fetchActiveSessions = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/attendance/active-sessions');
      if (response.data.success) {
        setActiveSessions(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching active sessions:', error);
    }
  };

  const handleRouteChange = async (routeName) => {
    if (selectedRoute && socket) {
      socket.emit('unsubscribe_route', selectedRoute);
    }

    setSelectedRoute(routeName);
    setLoading(true);
    
    if (routeName && socket) {
      socket.emit('subscribe_route', routeName);
      
      try {
        // Fetch captain locations
        const locResponse = await axios.get(`http://localhost:5000/api/location/route/${encodeURIComponent(routeName)}/locations`);
        setCaptainLocations(locResponse.data);
        
        // Fetch active sessions for this route
        const sessResponse = await axios.get(`http://localhost:5000/api/attendance/active-sessions?routeName=${encodeURIComponent(routeName)}`);
        if (sessResponse.data.success) {
          setActiveSessions(sessResponse.data.data);
        }
        
        initializeMap(locResponse.data);
      } catch (error) {
        console.error('Error fetching route data:', error);
      }
    }
    setLoading(false);
  };

  const updateCaptainLocation = (locationData) => {
    setCaptainLocations(prev => {
      const updated = prev.filter(loc => loc.captainId !== locationData.captainId);
      return [...updated, locationData];
    });

    if (mapRef.current && markersRef.current[locationData.captainId]) {
      const marker = markersRef.current[locationData.captainId];
      marker.setLatLng([locationData.latitude, locationData.longitude]);
    }
  };

  const updateStudentCount = (attendanceData) => {
    // Update student count for the relevant captain/route
    if (attendanceData.route_name === selectedRoute) {
      fetchActiveSessions(); // Refresh session data to get updated counts
    }
  };

  const initializeMap = (locations) => {
    if (!mapRef.current) {
      mapRef.current = document.getElementById('map');
    }

    Object.values(markersRef.current).forEach(marker => {
      if (marker.remove) marker.remove();
    });
    markersRef.current = {};

    locations.forEach(location => {
      const marker = createMarker(location);
      markersRef.current[location.captainId] = marker;
    });
  };

  const createMarker = (location) => {
    return {
      setLatLng: (coords) => {
        console.log(`Marker moved to: ${coords[0]}, ${coords[1]}`);
      },
      remove: () => {
        console.log('Marker removed');
      }
    };
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStudentCountForCaptain = (captainId) => {
    const session = activeSessions.find(s => s.captain_id === captainId);
    return session ? session.students_onboard || 0 : 0;
  };

  const refreshData = () => {
    if (selectedRoute) {
      handleRouteChange(selectedRoute);
    }
  };

  return (
    <div className="min-h-screen bg-[#B3D9FF]">
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
          <Link to="/route-monitor" className="hover:text-blue-800 bg-blue-100 px-2 py-1 rounded">Route Monitor</Link>
          <button onClick={() => navigate('/')} className="hover:text-blue-800">Logout</button>
        </div>
        <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
          <FaUserCircle className="text-gray-600 text-2xl" />
        </div>
      </nav>

      <div className="p-6">
        <div className="bg-white shadow-lg rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-blue-600 flex items-center">
              <FaMapMarkedAlt className="mr-2" /> Route Monitor
            </h1>
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-sm text-gray-600">
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>

          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Select Route to Monitor
              </label>
              <button
                onClick={refreshData}
                disabled={loading}
                className="flex items-center px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                <FaSync className={`mr-1 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
            <select
              value={selectedRoute}
              onChange={(e) => handleRouteChange(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Choose a route...</option>
              {routes.map((route, index) => (
                <option key={index} value={route.route_name}>
                  {route.route_name}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-6">
            <div 
              id="map" 
              className="w-full h-96 bg-gray-200 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-400"
            >
              {selectedRoute ? (
                <div className="text-center">
                  <FaMapMarkedAlt className="text-4xl text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600">Map will be displayed here</p>
                  <p className="text-sm text-gray-500">Route: {selectedRoute}</p>
                  <p className="text-sm text-gray-500">
                    Active Captains: {captainLocations.length}
                  </p>
                </div>
              ) : (
                <div className="text-center">
                  <FaMapMarkedAlt className="text-4xl text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600">Select a route to view the map</p>
                </div>
              )}
            </div>
          </div>

          {selectedRoute && (
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <FaBus className="mr-2" /> Active Captains on {selectedRoute}
              </h2>
              
              {captainLocations.length === 0 ? (
                <div className="text-center py-8">
                  <FaBus className="text-4xl text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600">No active captains on this route</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {captainLocations.map((captain, index) => (
                    <div key={index} className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                            <FaUserCircle className="text-white text-xl" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-800">
                              {captain.captainName || `Captain ${captain.captainId}`}
                            </h3>
                            <p className="text-sm text-gray-600">
                              ID: {captain.captainId}
                            </p>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <FaClock className="text-blue-500" />
                            <span>Last seen: {formatTime(captain.timestamp)}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-sm text-gray-600 mt-1">
                            <FaMapPin className="text-green-500" />
                            <span>
                              {captain.latitude?.toFixed(4)}, {captain.longitude?.toFixed(4)}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2 text-sm text-gray-600 mt-1">
                            <FaUsers className="text-purple-500" />
                            <span>{getStudentCountForCaptain(captain.captainId)} students onboard</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RouteMonitor; 