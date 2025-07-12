import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import axios from 'axios';
import { 
  FaPlay, 
  FaStop, 
  FaMapMarkedAlt, 
  FaLocationArrow, 
  FaClock,
  FaUsers,
  FaRoute,
  FaExclamationTriangle
} from 'react-icons/fa';

const CaptainGPS = () => {
  const navigate = useNavigate();
  const [isTracking, setIsTracking] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [captainId, setCaptainId] = useState(null);
  const [routeName, setRouteName] = useState('');
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [locationInterval, setLocationInterval] = useState(null);
  const [studentsCount, setStudentsCount] = useState(0);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [error, setError] = useState(null);
  const [autoStarted, setAutoStarted] = useState(false);

  const locationIntervalRef = useRef(null);

  useEffect(() => {
    const newSocket = io('http://localhost:5000');
    
    newSocket.on('connect', () => {
      console.log('✅ Captain WebSocket connected:', newSocket.id);
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('❌ Captain WebSocket disconnected');
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('❌ Captain WebSocket connection error:', error);
      setError('WebSocket connection failed');
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  useEffect(() => {
    const fetchCaptainInfo = async () => {
      try {
        const phone = localStorage.getItem('captainPhone');
        if (!phone) {
          navigate('/captain-login');
          return;
        }

        const response = await axios.post('http://localhost:5000/api/auth/captains/check-phone', { phone });
        if (response.data.exists) {
          setCaptainId(response.data.captainId);
          setRouteName(response.data.routeName || 'Unknown Route');
          
          console.log('👤 Captain info loaded:', {
            captainId: response.data.captainId,
            routeName: response.data.routeName,
            isActive: response.data.isActive
          });

          // Check if captain is already tracking by querying the backend status
          try {
            const statusResponse = await axios.get(`http://localhost:5000/api/location/captain/${response.data.captainId}/status`);
            if (statusResponse.data.isTracking) {
              console.log('🔄 Captain is already tracking - restoring state');
              setIsTracking(true);
              setAutoStarted(true);
              
              // Get current location and start tracking
              if (socket && socket.connected) {
                setTimeout(() => {
                  startTracking();
                }, 1000);
              }
            } else if (!isTracking && !autoStarted && socket && socket.connected) {
              console.log('🚀 Auto-starting GPS tracking for captain...');
              setAutoStarted(true);
              setTimeout(() => {
                if (!isTracking) {
                  console.log('🎯 Triggering auto-start...');
                  startTracking();
                }
              }, 3000);
            }
          } catch (statusError) {
            console.warn('⚠️ Could not check tracking status, proceeding with auto-start');
            if (!isTracking && !autoStarted && socket && socket.connected) {
              console.log('🚀 Auto-starting GPS tracking for captain...');
              setAutoStarted(true);
              setTimeout(() => {
                if (!isTracking) {
                  console.log('🎯 Triggering auto-start...');
                  startTracking();
                }
              }, 3000);
            }
          }

          // Fetch students count for this route
          try {
            const studentsResponse = await axios.get(`http://localhost:5000/api/routes/${encodeURIComponent(response.data.routeName)}/students`);
            if (studentsResponse.data.success) {
              setStudentsCount(studentsResponse.data.data.length);
              console.log(`📊 Found ${studentsResponse.data.data.length} students on route: ${response.data.routeName}`);
            }
          } catch (studentsError) {
            console.warn('⚠️ Could not fetch students count:', studentsError);
          }
        }
      } catch (error) {
        console.error('❌ Error fetching captain info:', error);
        setError('Failed to load captain information');
      }
    };

    fetchCaptainInfo();
  }, [navigate, socket]); // Added socket dependency

  const getCurrentLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'));
        return;
      }

      console.log('🔍 Requesting geolocation...');

      // Check permission status first
      if (navigator.permissions) {
        navigator.permissions.query({ name: 'geolocation' }).then((result) => {
          console.log('Geolocation permission status:', result.state);
          if (result.state === 'denied') {
            reject(new Error('Location access denied. Please enable location permissions in your browser settings.'));
            return;
          }
        });
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: new Date().toISOString()
          };
          console.log('✅ Real GPS location obtained:', location);
          console.log(`📍 Accuracy: ±${Math.round(location.accuracy)}m`);
          
          // Validate that this is not a mock location
          if (location.accuracy > 10000) {
            console.warn('⚠️ Low accuracy location detected, might be mock location');
          }
          
          resolve(location);
        },
        (error) => {
          console.error('❌ Geolocation error:', error);
          let errorMessage;
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location access denied. Please enable location permissions and refresh the page.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information unavailable. Please ensure GPS is enabled.';
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timed out. Please try again.';
              break;
            default:
              errorMessage = 'Unknown location error occurred.';
              break;
          }
          reject(new Error(errorMessage));
        },
        {
          enableHighAccuracy: true,
          timeout: 15000, // Increased timeout
          maximumAge: 30000
        }
      );
    });
  };

  const sendLocationUpdate = async (location) => {
    try {
      if (!captainId || !socket) {
        console.error('❌ Cannot send location - missing captainId or socket:', { 
          captainId, 
          socketConnected: !!socket && socket.connected,
          routeName
        });
        return;
      }

      // Validate location data
      if (!location.latitude || !location.longitude) {
        console.error('❌ Invalid location data:', location);
        return;
      }

      const locationData = {
        captainId,
        latitude: location.latitude,
        longitude: location.longitude,
        timestamp: location.timestamp,
        routeName
      };

      console.log('📤 Sending location via HTTP API:', locationData);
      
      // Send via HTTP API
      const httpResponse = await axios.post('http://localhost:5000/api/location/captain/location', locationData);
      console.log('✅ HTTP API response:', httpResponse.status);

      console.log('📡 Sending location via WebSocket:', locationData);

      // Send via WebSocket only if connected
      if (socket && socket.connected) {
        socket.emit('captain_location_update', locationData);
        console.log('✅ WebSocket location sent successfully');
      } else {
        console.error('❌ WebSocket not connected, skipping WebSocket update');
      }
      
    } catch (error) {
      console.error('❌ Error sending location:', error);
      setError(`Failed to send location: ${error.message}`);
      throw error;
    }
  };

  const startTracking = async () => {
    try {
      setError(null);
      setIsTracking(true);
      
      console.log('� Starting GPS tracking...');
      
      // First, notify backend that tracking has started
      if (captainId) {
        console.log('🎯 Notifying backend - starting tracking for captain:', captainId);
        await axios.post(`http://localhost:5000/api/location/captain/${captainId}/start-tracking`);
        console.log('✅ Backend tracking started');
      }
      
      // Test location access first
      const location = await getCurrentLocation();
      setCurrentLocation(location);
      setLastUpdate(new Date().toISOString());
      
      // Send initial location
      await sendLocationUpdate(location);
      
      console.log('✅ Initial location sent, starting interval...');

      // Clear any existing interval first
      if (locationIntervalRef.current) {
        clearInterval(locationIntervalRef.current);
      }

      // Set up location tracking interval
      const interval = setInterval(async () => {
        try {
          console.log('⏰ Interval triggered - getting new location...');
          const newLocation = await getCurrentLocation();
          setCurrentLocation(newLocation);
          setLastUpdate(new Date().toISOString());

          await sendLocationUpdate(newLocation);
          console.log('✅ Location update cycle completed successfully');
        } catch (error) {
          console.error('❌ Error in tracking interval:', error);
          setError('GPS tracking interrupted: ' + error.message);
          
          // If it's a permission error, stop tracking completely
          if (error.message.includes('denied') || error.message.includes('permission')) {
            console.error('❌ Stopping tracking due to permission error');
            clearInterval(interval);
            setIsTracking(false);
            setAutoStarted(false);
          }
          // For other errors, just log and continue trying
        }
      }, 5000); // Update location every 5 seconds

      locationIntervalRef.current = interval;
      console.log('✅ Location tracking started successfully');
    } catch (error) {
      console.error('❌ Failed to start tracking:', error);
      setError(`Failed to start location tracking: ${error.message}`);
      setIsTracking(false);
      
      // Clear interval if it was set
      if (locationIntervalRef.current) {
        clearInterval(locationIntervalRef.current);
        locationIntervalRef.current = null;
      }
      
      // Show helpful instructions
      if (error.message.includes('denied') || error.message.includes('permission')) {
        setError(
          '📍 Location access required for GPS tracking. Please:\n' +
          '1. Click the location icon in your browser address bar\n' +
          '2. Select "Allow" for location access\n' +
          '3. Refresh the page and try again'
        );
      }
    }
  };

  const requestLocationPermission = async () => {
    try {
      setError(null);
      console.log('🔓 Testing location permission...');
      
      // Don't start full tracking, just test location access
      const location = await getCurrentLocation();
      console.log('✅ Location permission granted:', location);
      
      // Set the location temporarily for display
      setCurrentLocation(location);
      
      setError(null);
      
      // Show success message
      alert(`✅ Location access working!\nLatitude: ${location.latitude.toFixed(6)}\nLongitude: ${location.longitude.toFixed(6)}\n\nYou can now start ride tracking.`);
      
    } catch (error) {
      console.error('❌ Permission test failed:', error);
      setError(
        `❌ Test failed: ${error.message}\n\n` +
        'To enable location access:\n' +
        '1. Look for the location icon 📍 in your browser\'s address bar\n' +
        '2. Click it and select "Allow"\n' +
        '3. If no icon appears, go to Site Settings and enable Location\n' +
        '4. Refresh this page and try again'
      );
    }
  };

  const stopTracking = async () => {
    try {
      console.log('🛑 Stopping GPS tracking...');
      
      // Send ride end notification BEFORE clearing intervals and stopping tracking
      if (captainId && socket && socket.connected && routeName) {
        try {
          console.log('📡 Sending ride end notification to students...');
          const rideEndData = {
            captainId,
            routeName
          };
          socket.emit('captain_ride_ended', rideEndData);
          console.log('✅ Ride end notification sent via WebSocket');
        } catch (error) {
          console.error('❌ Error sending ride end notification:', error);
        }
      }
      
      // Clear interval first
      if (locationIntervalRef.current) {
        clearInterval(locationIntervalRef.current);
        locationIntervalRef.current = null;
        console.log('✅ Location interval cleared');
      }

      setIsTracking(false);
      setCurrentLocation(null);
      setLastUpdate(null);

      if (captainId) {
        try {
          console.log('🎯 Notifying backend - stopping tracking for captain:', captainId);
          await axios.post(`http://localhost:5000/api/location/captain/${captainId}/stop-tracking`);
          console.log('✅ Backend tracking stopped');
          
          const phone = localStorage.getItem('captainPhone');
          await axios.post('http://localhost:5000/api/auth/captains/stop-ride', {
            phone: phone
          });
          console.log('✅ Ride stopped successfully');
          
          alert('Ride stopped successfully! Students have been notified. Redirecting to portal...');
          navigate('/captain/home');
        } catch (error) {
          console.error('❌ Error stopping tracking on backend:', error);
        }
      }

      console.log('✅ Location tracking stopped');
    } catch (error) {
      console.error('❌ Error in stopTracking:', error);
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return 'Never';
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  useEffect(() => {
    return () => {
      if (locationIntervalRef.current) {
        clearInterval(locationIntervalRef.current);
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-blue-200 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-blue-800 flex items-center">
                <FaMapMarkedAlt className="mr-2" /> GPS Tracking
              </h1>
              <p className="text-gray-600">Route: {routeName}</p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/captain/home')}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200"
              >
                Back to Portal
              </button>
              <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-sm text-gray-600">
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            <div className="flex items-start">
              <FaExclamationTriangle className="mr-2 mt-1 flex-shrink-0" />
              <div className="flex-grow">
                <div className="whitespace-pre-line">{error}</div>
                {error.includes('permission') && (
                  <div className="mt-3 space-x-2">
                    <button
                      onClick={requestLocationPermission}
                      className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors duration-200 text-sm"
                    >
                      🔓 Request Location Permission
                    </button>
                    <button
                      onClick={() => window.location.reload()}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 text-sm"
                    >
                      🔄 Reload Page
                    </button>
                  </div>
                )}
                {!error.includes('permission') && (
                  <button
                    onClick={() => {
                      setError(null);
                      setAutoStarted(false);
                      setIsTracking(false);
                      if (locationIntervalRef.current) {
                        clearInterval(locationIntervalRef.current);
                        locationIntervalRef.current = null;
                      }
                      setTimeout(() => {
                        if (captainId && socket && socket.connected) {
                          startTracking();
                        }
                      }, 1000);
                    }}
                    className="mt-3 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors duration-200 text-sm"
                  >
                    🔄 Retry GPS Tracking
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {autoStarted && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6 flex items-center">
            <FaPlay className="mr-2" />
            GPS tracking automatically started! Your location is now being shared with students and admin.
          </div>
        )}

        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Tracking Controls</h2>
            <div className="flex items-center space-x-2">
              <span className={`w-2 h-2 rounded-full ${isTracking ? 'bg-green-500' : 'bg-gray-400'}`}></span>
              <span className="text-sm text-gray-600">
                {isTracking ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>

          <div className="mb-4">
            <button
              onClick={requestLocationPermission}
              className="flex items-center px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm"
            >
              <FaLocationArrow className="mr-2" />
              🧪 Test Location Access
            </button>
          </div>

          <div className="flex space-x-4">
            <button
              onClick={startTracking}
              disabled={isTracking || !isConnected}
              className={`flex items-center px-6 py-3 rounded-lg font-semibold transition-colors ${
                isTracking || !isConnected
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-green-500 text-white hover:bg-green-600'
              }`}
            >
              <FaPlay className="mr-2" />
              Start Ride
            </button>

            <button
              onClick={stopTracking}
              disabled={!isTracking}
              className={`flex items-center px-6 py-3 rounded-lg font-semibold transition-colors ${
                !isTracking
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-red-500 text-white hover:bg-red-600'
              }`}
            >
              <FaStop className="mr-2" />
              Stop Ride
            </button>
          </div>
        </div>

        {currentLocation && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <FaLocationArrow className="mr-2" /> Current Location
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Latitude:</span>
                  <span className="font-mono font-semibold">
                    {currentLocation.latitude.toFixed(6)}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-gray-600">Longitude:</span>
                  <span className="font-mono font-semibold">
                    {currentLocation.longitude.toFixed(6)}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-gray-600">Accuracy:</span>
                  <span className="font-semibold">
                    ±{Math.round(currentLocation.accuracy)}m
                  </span>
                </div>
              </div>

              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Last Update:</span>
                  <span className="font-semibold">{formatTime(lastUpdate)}</span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-gray-600">Students on Route:</span>
                  <span className="font-semibold flex items-center">
                    <FaUsers className="mr-1" />
                    {studentsCount}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-gray-600">Route:</span>
                  <span className="font-semibold flex items-center">
                    <FaRoute className="mr-1" />
                    {routeName}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Live Map</h2>
          <div className="w-full h-64 bg-gray-200 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-400">
            {currentLocation ? (
              <div className="text-center">
                <FaMapMarkedAlt className="text-4xl text-blue-500 mx-auto mb-2" />
                <p className="text-gray-600">Map will be displayed here</p>
                <p className="text-sm text-gray-500">
                  Location: {currentLocation.latitude.toFixed(4)}, {currentLocation.longitude.toFixed(4)}
                </p>
              </div>
            ) : (
              <div className="text-center">
                <FaMapMarkedAlt className="text-4xl text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600">Start tracking to see your location on the map</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CaptainGPS; 