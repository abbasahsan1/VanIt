import React, { useState, useEffect } from 'react';
import { FaBars, FaArrowLeft, FaBell, FaExclamationTriangle, FaUserCircle, FaQrcode, FaRobot, FaHome, FaClipboardList, FaCommentDots, FaMoneyBill, FaMapMarkedAlt, FaRegEnvelope, FaPlay, FaStop } from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const CaptainPortal = () => {
  const navigate = useNavigate();
  const [routeName, setRouteName] = useState('');
  const [stops, setStops] = useState([]);
  const [studentsInRide, setStudentsInRide] = useState(0);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showSetPasswordModal, setShowSetPasswordModal] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [captainPhone, setCaptainPhone] = useState('');
  const [isRideActive, setIsRideActive] = useState(false);
  const [isLoadingRoute, setIsLoadingRoute] = useState(true);
  const [routeError, setRouteError] = useState(null);
  const [captainLocation, setCaptainLocation] = useState(null);
  const [captainId, setCaptainId] = useState(null);

  useEffect(() => {
    setStudentsInRide(20);

    const token = localStorage.getItem('captainToken');
    if (token) {
      const storedPhone = localStorage.getItem('captainPhone');
      if (storedPhone) {
        setCaptainPhone(storedPhone);
        axios.post("http://localhost:5000/api/auth/captains/check-phone", { phone: storedPhone })
          .then(res => {
            if (!res.data.hasPassword) {
              setShowSetPasswordModal(true);
            }
          })
          .catch(err => console.error("Error checking password status:", err));
      }
    }
  }, []);

  useEffect(() => {
    const fetchAssignedRoute = async () => {
      const phone = localStorage.getItem("captainPhone");
      if (!phone) {
        setIsLoadingRoute(false);
        return;
      }
      
      try {
        setIsLoadingRoute(true);
        setRouteError(null);
        const { data } = await axios.post("http://localhost:5000/api/auth/captains/assigned-route", { phone });
        setRouteName(data.routeName);
        setStops(data.stops);
        
        const captainResponse = await axios.post("http://localhost:5000/api/auth/captains/check-phone", { phone });
        if (captainResponse.data.isActive) {
          setIsRideActive(true);
        }
      } catch (err) {
        console.error("Error fetching assigned route:", err);
        setRouteError('Failed to load route information. Please try again.');
      } finally {
        setIsLoadingRoute(false);
      }
    };
  
    fetchAssignedRoute();
  }, []);

  useEffect(() => {
    const checkIfPasswordSet = async () => {
      const phone = localStorage.getItem('captainPhone');
      if (!phone) return;
  
      try {
        const res = await axios.post("http://localhost:5000/api/auth/captains/check-phone", { phone });
        if (res.data.exists && !res.data.hasPassword) {
          setShowSetPasswordModal(true);
        }
      } catch (err) {
        console.error("Error checking password status:", err);
      }
    };
  
    checkIfPasswordSet();
  }, []);

  useEffect(() => {
    const checkIfPasswordResetNeeded = async () => {
      const phone = localStorage.getItem('captainPhone');
      const otpUsed = localStorage.getItem('otpLogin') === 'true';
  
      if (!phone || !otpUsed) return;
  
      try {
        const res = await axios.post("http://localhost:5000/api/auth/captains/check-phone", { phone });
  
        if (!res.data.hasPassword) {
          setShowSetPasswordModal(true);
        } else {
          localStorage.removeItem("otpLogin");
        }
      } catch (err) {
        console.error("Error checking password:", err);
      }
    };
  
    checkIfPasswordResetNeeded();
  }, []);
  
  useEffect(() => {
    const checkRideStatus = async () => {
      const phone = localStorage.getItem('captainPhone');
      if (!phone) return;
      
      try {
        const response = await axios.post('http://localhost:5000/api/auth/captains/check-phone', { phone });
        if (response.data.isActive) {
          setIsRideActive(true);
          setCaptainId(response.data.captainId);
        } else {
          setIsRideActive(false);
        }
      } catch (error) {
        console.error('Error checking ride status:', error);
      }
    };

    checkRideStatus();
    
    const interval = setInterval(checkRideStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchCaptainLocation = async () => {
      if (!captainId || !isRideActive) return;
      
      try {
        const response = await axios.get(`http://localhost:5000/api/location/captain/${captainId}/location`);
        if (response.data) {
          setCaptainLocation(response.data);
        }
      } catch (error) {
        console.error('Error fetching captain location:', error);
      }
    };

    fetchCaptainLocation();
    
    const interval = setInterval(fetchCaptainLocation, 3000);
    return () => clearInterval(interval);
  }, [captainId, isRideActive]);

  const handleSetPassword = async () => {
    const phone = localStorage.getItem("captainPhone");
    if (!phone) return;

    if (password !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    try {
      const res = await axios.post("http://localhost:5000/api/auth/captains/set-password", {
        phone,
        password,
      });

      if (res.status === 200) {
        alert("Password set successfully! Please login again.");
        localStorage.removeItem("captainToken");
        localStorage.removeItem("otpLogin");
        setShowSetPasswordModal(false);
        navigate("/captain-login");
      }
    } catch (error) {
      console.error("Error setting password:", error);
      alert("Failed to set password. Try again.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('captainToken');
    navigate('/landing-page');
  };

  const toggleSidebar = () => {
    setShowSidebar(!showSidebar);
    setShowProfileDropdown(false);
  };

  const toggleProfileDropdown = () => {
    setShowProfileDropdown(!showProfileDropdown);
    setShowSidebar(false);
  };

  const handleStartRide = async () => {
    if (!routeName) {
      alert('No route assigned. Please contact admin.');
      return;
    }
    
    try {
      const phone = localStorage.getItem('captainPhone');
      const response = await axios.post('http://localhost:5000/api/auth/captains/start-ride', {
        phone: phone,
        routeName: routeName
      });
      
      if (response.status === 200) {
        setIsRideActive(true);
        alert('Ride started successfully! Redirecting to GPS tracking...');
        navigate('/captain/gps');
      }
    } catch (error) {
      console.error('Error starting ride:', error);
      alert('Failed to start ride. Please try again.');
    }
  };

  const handleStopRide = async () => {
    try {
      const phone = localStorage.getItem('captainPhone');
      const response = await axios.post('http://localhost:5000/api/auth/captains/stop-ride', {
        phone: phone
      });
      
      if (response.status === 200) {
        setIsRideActive(false);
        alert('Ride stopped successfully!');
      }
    } catch (error) {
      console.error('Error stopping ride:', error);
      alert('Failed to stop ride. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-blue-200">
      <nav className="flex justify-between items-center bg-blue-500 text-white p-4">
        <FaBars className="text-2xl cursor-pointer" onClick={toggleSidebar} />
        <h1 className="text-2xl font-semibold">VANit! Captain Portal</h1>
        <div className="flex items-center relative">
          <button
            onClick={isRideActive ? handleStopRide : handleStartRide}
            className={`flex items-center px-4 py-2 rounded-lg mx-4 transition-colors duration-200 ${
              isRideActive 
                ? 'bg-red-600 hover:bg-red-700' 
                : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            {isRideActive ? (
              <>
                <FaStop className="mr-2" />
                Stop Ride
              </>
            ) : (
              <>
                <FaPlay className="mr-2" />
                Start Ride
              </>
            )}
          </button>
          <FaExclamationTriangle className="mx-4 cursor-pointer text-2xl" title="SOS" />
          <FaBell className="mx-4 cursor-pointer text-2xl" title="Notifications" />
          <div className="relative">
            <FaUserCircle
              className="w-10 h-10 rounded-full cursor-pointer"
              onClick={toggleProfileDropdown}
            />
            {showProfileDropdown && (
              <div className="absolute right-0 mt-2 w-40 bg-white rounded-md shadow-lg z-10">
                <ul className="text-gray-700">
                  <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer">
                    <Link to="/captain/profile">Profile</Link>
                  </li>
                  <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer" onClick={handleLogout}>Logout</li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </nav>

      {showSidebar && (
        <div className="fixed top-0 left-0 w-64 h-full bg-blue-100 shadow-lg z-20">
          <div className="flex items-center justify-between p-4">
            <div>
              <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center">
                <FaUserCircle size={36} />
              </div>
              <p className="font-bold">Captain</p>
              <p className="text-gray-600 text-sm">{captainPhone}</p>
            </div>
            <FaArrowLeft className="text-2xl cursor-pointer" onClick={toggleSidebar} />
          </div>
          
          {captainLocation && isRideActive && (
            <div className="p-4 bg-white mx-4 rounded-lg shadow mb-4">
              <h3 className="font-semibold text-blue-700 mb-2">Current Location</h3>
              <div className="text-sm space-y-1">
                <p><span className="font-medium">Lat:</span> {captainLocation.latitude?.toFixed(6)}</p>
                <p><span className="font-medium">Lng:</span> {captainLocation.longitude?.toFixed(6)}</p>
                <p><span className="font-medium">Updated:</span> {new Date(captainLocation.timestamp).toLocaleTimeString()}</p>
              </div>
            </div>
          )}
          
          <ul className="space-y-4 pl-6">
            <li><Link to="/captain/home" className="flex items-center text-lg text-blue-700 hover:underline"><FaHome className="mr-2" /> Home Page</Link></li>
            <li><Link to="/captain/profile" className="flex items-center text-lg text-blue-700 hover:underline"><FaUserCircle className="mr-2" /> Profile</Link></li>
            <li><Link to="/captain/attendance" className="flex items-center text-lg text-blue-700 hover:underline"><FaClipboardList className="mr-2" /> Attendance</Link></li>
            <li><Link to="/captain/routes" className="flex items-center text-lg text-blue-700 hover:underline"><FaMapMarkedAlt className="mr-2" /> Routes</Link></li>
            <li><Link to="/captain/gps" className="flex items-center text-lg text-blue-700 hover:underline"><FaMapMarkedAlt className="mr-2" /> GPS Tracking</Link></li>
            <li><Link to="/captain/notifications" className="flex items-center text-lg text-blue-700 hover:underline"><FaBell className="mr-2" /> Notifications</Link></li>
            <li><Link to="/captain/emergency" className="flex items-center text-lg text-blue-700 hover:underline"><FaExclamationTriangle className="mr-2" /> Emergency Button</Link></li>
            <li>
              <Link to="/captain/complaints" className="flex items-center text-lg text-blue-700 hover:underline">
                <FaRegEnvelope className="mr-2" /> Complain Box
              </Link>
            </li>
          </ul>
        </div>
      )}

      <div className="p-8 flex justify-around items-center">
        <div className="bg-white p-6 rounded-lg shadow-lg w-1/2">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-orange-500">Bus Route</h1>
            {isRideActive && (
              <div className="flex items-center bg-green-100 text-green-800 px-3 py-1 rounded-full">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                <span className="text-sm font-semibold">Ride Active</span>
              </div>
            )}
          </div>
          {isLoadingRoute ? (
            <div className="mt-4">
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <span className="ml-3 text-gray-600">Loading route information...</span>
              </div>
            </div>
          ) : routeError ? (
            <div className="mt-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800 text-sm">{routeError}</p>
                <button 
                  onClick={() => window.location.reload()} 
                  className="mt-2 bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                >
                  Retry
                </button>
              </div>
            </div>
          ) : routeName ? (
            <div className="mt-4">
              <h2 className="text-xl font-bold text-blue-600 mb-4">Assigned Route: {routeName}</h2>
              {stops.length > 0 ? (
                <div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">Stops:</h3>
                  <ul className="text-gray-600 space-y-1">
                    {stops.map((stop, idx) => (
                      <li key={idx} className="flex items-center">
                        <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm mr-3">
                          {idx + 1}
                        </span>
                        {stop}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="text-gray-500">No stops assigned to this route.</p>
              )}
            </div>
          ) : (
            <div className="mt-4">
              <p className="text-gray-600 mb-4">
                No route has been assigned yet. Please contact the admin to get your route assignment.
              </p>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-yellow-800 text-sm">
                  <strong>Note:</strong> You need a route assignment to start your ride.
                </p>
              </div>
            </div>
          )}
          <div className="mt-6 flex items-center">
            <FaQrcode className="text-6xl text-gray-700" title="QR Code" />
          </div>
        </div>

        <div className="bg-blue-100 p-8 rounded-lg shadow-lg flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-orange-500">CUST</h1>
            <h2 className="text-2xl font-semibold mt-4">Students in Ride</h2>
            <p className="text-6xl font-bold mt-2">{studentsInRide}</p>
          </div>
        </div>
      </div>

      {isRideActive && captainLocation && (
        <div className="p-8">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl mx-auto">
            <h2 className="text-xl font-semibold text-blue-800 mb-4 flex items-center">
              <FaMapMarkedAlt className="mr-2" /> Live Location
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
                  <span className="text-gray-600">Last Update:</span>
                  <span className="font-semibold">
                    {new Date(captainLocation.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-gray-600">Status:</span>
                  <span className="font-semibold text-green-600">Active</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="fixed bottom-4 right-4">
        <FaRobot className="text-6xl text-blue-600 cursor-pointer" title="Chatbot" />
      </div>

      {showSetPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96">
            <h2 className="text-xl font-bold text-blue-700 mb-4">Set Your Password</h2>
            <input
              type="password"
              placeholder="New Password"
              className="w-full p-2 mb-3 border rounded"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <input
              type="password"
              placeholder="Confirm Password"
              className="w-full p-2 mb-3 border rounded"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            <button
              onClick={async () => {
                if (password !== confirmPassword) {
                  alert("Passwords do not match.");
                  return;
                }
                try {
                  const res = await axios.post("http://localhost:5000/api/auth/captains/set-password", {
                    phone: captainPhone,
                    password
                  });
                  alert("Password set successfully.");
                  setShowSetPasswordModal(false);
                  navigate("/captain-login");
                } catch (err) {
                  alert("Failed to set password.");
                  console.error(err);
                }
              }}
              className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
            >
              Set Password
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CaptainPortal;
