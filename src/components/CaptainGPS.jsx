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
      console.log('Connected to WebSocket server');
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from WebSocket server');
      setIsConnected(false);
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
          
          if (response.data.isActive) {
            console.log('Captain is already active, starting tracking automatically...');
            setAutoStarted(true);
            setTimeout(() => {
              startTracking();
            }, 1000);
          }
        }
      } catch (error) {
        console.error('Error fetching captain info:', error);
        setError('Failed to load captain information');
      }
    };

    fetchCaptainInfo();
  }, [navigate]);

  const getCurrentLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: new Date().toISOString()
          };
          resolve(location);
        },
        (error) => {
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 30000
        }
      );
    });
  };

  const startTracking = async () => {
    try {
      setError(null);
      
      const location = await getCurrentLocation();
      setCurrentLocation(location);

      const interval = setInterval(async () => {
        try {
          const newLocation = await getCurrentLocation();
          setCurrentLocation(newLocation);
          setLastUpdate(new Date().toISOString());

          if (captainId && socket) {
            await axios.post('http://localhost:5000/api/location/captain/location', {
              captainId,
              latitude: newLocation.latitude,
              longitude: newLocation.longitude,
              timestamp: newLocation.timestamp
            });

            socket.emit('captain_location_update', {
              captainId,
              latitude: newLocation.latitude,
              longitude: newLocation.longitude,
              timestamp: newLocation.timestamp,
              routeName
            });
          }
        } catch (error) {
          console.error('Error updating location:', error);
          setError('Failed to update location');
        }
      }, parseInt(process.env.LOCATION_INTERVAL_MS) || 5000);

      locationIntervalRef.current = interval;
      setIsTracking(true);

      if (captainId) {
        await axios.post(`http://localhost:5000/api/location/captain/${captainId}/start-tracking`);
      }

      console.log('Location tracking started');
    } catch (error) {
      console.error('Error starting tracking:', error);
      setError('Failed to start location tracking. Please check your location permissions.');
    }
  };

  const stopTracking = async () => {
    if (locationIntervalRef.current) {
      clearInterval(locationIntervalRef.current);
      locationIntervalRef.current = null;
    }

    setIsTracking(false);
    setCurrentLocation(null);
    setLastUpdate(null);

    if (captainId) {
      try {
        await axios.post(`http://localhost:5000/api/location/captain/${captainId}/stop-tracking`);
        const phone = localStorage.getItem('captainPhone');
        await axios.post('http://localhost:5000/api/auth/captains/stop-ride', {
          phone: phone
        });
        alert('Ride stopped successfully! Redirecting to portal...');
        navigate('/captain/home');
      } catch (error) {
        console.error('Error stopping tracking:', error);
      }
    }

    console.log('Location tracking stopped');
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
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6 flex items-center">
            <FaExclamationTriangle className="mr-2" />
            {error}
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