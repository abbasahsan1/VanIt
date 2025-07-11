import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import axios from 'axios';
import { 
  FaMapMarkedAlt, 
  FaBus, 
  FaClock, 
  FaMapPin, 
  FaRoute,
  FaBell,
  FaExclamationTriangle,
  FaUserCircle,
  FaArrowLeft
} from 'react-icons/fa';

const StudentBusTracking = () => {
  const navigate = useNavigate();
  const [studentData, setStudentData] = useState({});
  const [captainLocation, setCaptainLocation] = useState(null);
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastNotification, setLastNotification] = useState(null);
  const [showNotification, setShowNotification] = useState(false);
  const [error, setError] = useState(null);
  const [rideEnded, setRideEnded] = useState(false);
  const [rideEndMessage, setRideEndMessage] = useState('');

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
      console.log('🚌 Received captain location update:', data);
      setCaptainLocation({
        captainId: data.captainId,
        latitude: parseFloat(data.latitude),
        longitude: parseFloat(data.longitude),
        timestamp: data.timestamp,
        captainName: data.captainName,
        routeName: data.routeName
      });
    });

    newSocket.on('notification', (data) => {
      console.log('🔔 Received notification:', data);
      setLastNotification(data);
      setShowNotification(true);
      
      setTimeout(() => {
        setShowNotification(false);
      }, 10000);
    });

    newSocket.on('ride_ended', (data) => {
      console.log('🛑 Received ride end notification:', data);
      setRideEnded(true);
      setRideEndMessage(data.message || 'The ride has ended.');
      setCaptainLocation(null); // Clear location when ride ends
      setLastNotification(null); // Clear notifications
      
      // Show a more prominent notification
      alert(`🛑 ${data.message || 'The ride has ended.'}`);
    });

    newSocket.on('error', (error) => {
      console.error('Socket error:', error);
      setError('Connection error occurred');
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        const email = localStorage.getItem('studentEmail');
        if (!email) {
          navigate('/student-login');
          return;
        }

        const response = await axios.post('http://localhost:5000/api/get-student-by-email', { email });
        if (response.status === 200) {
          const student = response.data;
          setStudentData(student);

          if (student.route_name && socket) {
            console.log(`🔗 Subscribing to route: "${student.route_name}"`);
            socket.emit('subscribe_route', student.route_name);
            console.log(`✅ Subscription sent for route: ${student.route_name}`);
            
            // Add a small delay and check server response
            setTimeout(() => {
              console.log(`🔍 Checking subscription status for route: ${student.route_name}`);
            }, 1000);
            
            // Immediately check for any existing captain location on this route
            try {
              console.log(`📍 Checking for existing locations on route: ${student.route_name}`);
              const locationResponse = await axios.get(`http://localhost:5000/api/location/route/${encodeURIComponent(student.route_name)}/locations`);
              console.log(`📍 Location API response:`, locationResponse.data);
              if (locationResponse.status === 200 && locationResponse.data.length > 0) {
                const activeLocation = locationResponse.data[0];
                console.log('Found existing captain location:', activeLocation);
                setCaptainLocation(activeLocation);
              } else {
                console.log('No active captains found for this route');
              }
            } catch (error) {
              console.error('Error fetching captain location:', error);
            }
          }

          if (student.id) {
            try {
              const notificationResponse = await axios.get(`http://localhost:5000/api/location/student/${student.id}/last-notification`);
              if (notificationResponse.status === 200) {
                setLastNotification(notificationResponse.data);
              }
            } catch (error) {
              console.log('No recent notifications');
            }
          }
        }
      } catch (error) {
        console.error('Error fetching student data:', error);
        setError('Failed to load student information');
      }
    };

    if (socket) {
      fetchStudentData();
    }
  }, [socket, navigate]);

  const getEstimatedArrival = () => {
    if (!captainLocation || !lastNotification) return 'Unknown';
    
    const distance = lastNotification.distance || 2;
    const estimatedMinutes = Math.round(distance * 3);
    return `${estimatedMinutes} minutes`;
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return 'Never';
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const dismissNotification = () => {
    setShowNotification(false);
  };

  return (
    <div className="min-h-screen bg-blue-200 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-4">
          <button
            onClick={() => navigate('/student/home')}
            className="flex items-center text-blue-600 hover:text-blue-800 transition-colors duration-200"
          >
            <FaArrowLeft className="mr-2" />
            Back to Portal
          </button>
        </div>

        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg shadow-lg p-6 mb-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="bg-white bg-opacity-20 rounded-full p-3 mr-4">
                <FaMapMarkedAlt className="text-3xl" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Live Bus Tracking</h2>
                <p className="text-blue-100">
                  {captainLocation ? 'Your bus is currently being tracked' : 'Waiting for bus location...'}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className={`w-4 h-4 rounded-full ${captainLocation ? 'bg-green-400' : 'bg-yellow-400'} mb-2`}></div>
              <span className="text-sm text-blue-100">
                {captainLocation ? 'Active' : 'Connecting...'}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-blue-800 flex items-center">
                <FaBus className="mr-2" /> My Bus
              </h1>
              <p className="text-gray-600">
                Route: {studentData.route_name || 'Loading...'} | 
                Stop: {studentData.stop_name || 'Loading...'}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-sm text-gray-600">
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6 flex items-center">
            <FaExclamationTriangle className="mr-2" />
            {error}
          </div>
        )}

        {showNotification && lastNotification && (
          <div className="bg-orange-100 border border-orange-400 text-orange-700 px-4 py-3 rounded mb-6 flex items-center justify-between">
            <div className="flex items-center">
              <FaBell className="mr-2" />
              <span>{lastNotification.message}</span>
            </div>
            <button
              onClick={dismissNotification}
              className="text-orange-700 hover:text-orange-900"
            >
              ×
            </button>
          </div>
        )}

        {rideEnded && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            <div className="flex items-center">
              <FaExclamationTriangle className="mr-2 text-xl" />
              <div className="flex-grow">
                <h3 className="font-semibold text-lg">🛑 Ride Has Ended</h3>
                <p className="text-sm mt-1">{rideEndMessage}</p>
                <div className="mt-3 space-x-2">
                  <button
                    onClick={() => navigate('/student/home')}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors duration-200 text-sm"
                  >
                    Return to Portal
                  </button>
                  <button
                    onClick={() => setRideEnded(false)}
                    className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors duration-200 text-sm"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            <FaBus className="mr-2" /> Bus Status
          </h2>
          
          {rideEnded ? (
            <div className="text-center py-8">
              <FaExclamationTriangle className="text-4xl text-red-500 mx-auto mb-2" />
              <p className="text-red-600 font-semibold text-lg">🛑 Ride has ended</p>
              <p className="text-sm text-gray-500 mt-2">The captain has stopped the bus service</p>
            </div>
          ) : captainLocation ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
                  <FaUserCircle className="mr-2" /> Captain Information
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Captain:</span>
                    <span className="font-semibold">{captainLocation.captainName || 'Unknown'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Route:</span>
                    <span className="font-semibold">{studentData.route_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Your Stop:</span>
                    <span className="font-semibold">{studentData.stop_name}</span>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
                  <FaClock className="mr-2" /> Timing Information
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Last Update:</span>
                    <span className="font-semibold">{formatTime(captainLocation.timestamp)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Estimated Arrival:</span>
                    <span className="font-semibold">{getEstimatedArrival()}</span>
                  </div>
                  {lastNotification && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Distance from Stop:</span>
                      <span className="font-semibold">{lastNotification.distance} km</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <FaBus className="text-4xl text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600">Waiting for captain location...</p>
              <p className="text-sm text-gray-500">Make sure your captain has started the ride</p>
            </div>
          )}
        </div>

        {captainLocation && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <FaMapPin className="mr-2" /> Captain Location
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Latitude:</span>
                  <span className="font-mono font-semibold">
                    {captainLocation.latitude?.toFixed(6)}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-gray-600">Longitude:</span>
                  <span className="font-mono font-semibold">
                    {captainLocation.longitude?.toFixed(6)}
                  </span>
                </div>
              </div>

              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Route:</span>
                  <span className="font-semibold flex items-center">
                    <FaRoute className="mr-1" />
                    {studentData.route_name}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-gray-600">Status:</span>
                  <span className="font-semibold text-green-600">Active</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            <FaMapMarkedAlt className="mr-2" /> Live Map
          </h2>
          <div className="w-full h-80 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg flex items-center justify-center border-2 border-dashed border-blue-300 relative overflow-hidden">
            {rideEnded ? (
              <div className="text-center z-10">
                <div className="bg-white rounded-full p-4 shadow-lg mb-4 inline-block">
                  <FaExclamationTriangle className="text-5xl text-red-500" />
                </div>
                <h3 className="text-xl font-semibold text-red-800 mb-2">🛑 Ride Ended</h3>
                <p className="text-gray-700 mb-3">The bus service has been stopped</p>
                <div className="bg-white rounded-lg p-4 shadow-md max-w-md mx-auto">
                  <p className="text-gray-600 text-sm">No further location updates will be received</p>
                </div>
              </div>
            ) : captainLocation ? (
              <div className="text-center z-10">
                <div className="bg-white rounded-full p-4 shadow-lg mb-4 inline-block">
                  <FaMapMarkedAlt className="text-5xl text-blue-500" />
                </div>
                <h3 className="text-xl font-semibold text-blue-800 mb-2">Bus Location Active</h3>
                <p className="text-gray-700 mb-3">Your bus is currently being tracked</p>
                <div className="bg-white rounded-lg p-4 shadow-md max-w-md mx-auto">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Latitude:</span>
                      <p className="font-mono font-semibold text-blue-800">
                        {captainLocation.latitude?.toFixed(6)}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-600">Longitude:</span>
                      <p className="font-mono font-semibold text-blue-800">
                        {captainLocation.longitude?.toFixed(6)}
                      </p>
                    </div>
                  </div>
                  {lastNotification && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-orange-600 font-semibold">
                        📍 {lastNotification.distance} km from {lastNotification.stopName}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        Estimated arrival: {getEstimatedArrival()}
                      </p>
                    </div>
                  )}
                </div>
                <div className="mt-4">
                  <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200">
                    View Full Map
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center z-10">
                <div className="bg-white rounded-full p-4 shadow-lg mb-4 inline-block">
                  <FaMapMarkedAlt className="text-5xl text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-600 mb-2">Waiting for Bus Location</h3>
                <p className="text-gray-500 mb-3">Your bus location will appear here once tracking starts</p>
                <div className="bg-white rounded-lg p-4 shadow-md max-w-md mx-auto">
                  <div className="flex items-center justify-center space-x-2 text-gray-500">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                    <span className="ml-2 text-sm">Connecting to bus...</span>
                  </div>
                </div>
              </div>
            )}
            
            <div className="absolute inset-0 opacity-5">
              <div className="absolute top-4 left-4 w-8 h-8 border-2 border-blue-300 rounded-full"></div>
              <div className="absolute top-12 right-8 w-6 h-6 border-2 border-blue-300 rounded-full"></div>
              <div className="absolute bottom-8 left-12 w-4 h-4 border-2 border-blue-300 rounded-full"></div>
              <div className="absolute bottom-16 right-4 w-10 h-10 border-2 border-blue-300 rounded-full"></div>
            </div>
          </div>
        </div>

        {lastNotification && !showNotification && (
          <div className="bg-white rounded-lg shadow-lg p-6 mt-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <FaBell className="mr-2" /> Last Notification
            </h2>
            <div className="bg-orange-50 p-4 rounded-lg">
              <p className="text-gray-800 mb-2">{lastNotification.message}</p>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Received: {formatTime(lastNotification.timestamp)}</span>
                <span>Distance: {lastNotification.distance} km</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentBusTracking; 