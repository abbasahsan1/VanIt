import React, { useState } from 'react';
import { FaUser, FaLock } from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';  // Axios for backend requests

const LandingPage = () => {
  const [showUserTypePopup, setShowUserTypePopup] = useState(false);
  const [userType, setUserType] = useState(null); // Either 'student' or 'captain'
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    registration_number: '',
    bus_number: ''
  });
  const [statusMessage, setStatusMessage] = useState('');
  const navigate = useNavigate();  // Navigation for registration form

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };


  // Display the login/signup form based on the selected user type
  const handleUserTypeSelection = (type) => {
    if (type === 'captain') {
      navigate('/captain-login'); // Redirect to new login page
    } else {
      setUserType(type);
      setShowUserTypePopup(false);
      setShowLoginForm(true); // Show the student form only
    }
  };
  
  // const handleUserTypeSelection = (type) => {
  //   setUserType(type);
  //   setShowUserTypePopup(false); // Close the popup
  //   setShowLoginForm(true); // Display the form
  // };

  const switchForm = () => {
    setIsLogin(!isLogin);
  };

  // Handle form submission
const handleSubmit = async (e) => {
    e.preventDefault();

    // Construct API endpoint based on login/signup mode
    const endpoint = isLogin
        ? `http://localhost:5000/api/auth/${userType}s/login`
        : `http://localhost:5000/api/auth/${userType}s/signup`;

    console.log(`🚀 Sending Request to: ${endpoint}`);
    console.log("📤 Payload:", formData); // Debugging log

    // ✅ Check for missing fields (Signup only)
    if (!isLogin) {
        if (!formData.first_name || !formData.last_name || !formData.email || !formData.password || !formData.registration_number) {
            setStatusMessage("❌ All fields are required for signup!");
            return;
        }
    }

    try {
        // 🔹 Handle Signup
        if (!isLogin) {
            const signupResponse = await axios.post(endpoint, formData);
            console.log("✅ Signup Success:", signupResponse.data);
            setStatusMessage(signupResponse.data.message);

            if (signupResponse.status === 201) {
                // Automatically login after successful signup
                console.log("🔄 Logging in user after signup...");

                const loginEndpoint = `http://localhost:5000/api/auth/${userType}s/login`;
                const loginResponse = await axios.post(loginEndpoint, {
                    email: formData.email,
                    password: formData.password,
                });

                if (loginResponse.status === 200) {
                    console.log("🔐 Login Successful:", loginResponse.data);

                    // ✅ Fixed `localStorage.setItem()` syntax
                    localStorage.setItem(`${userType}Token`, loginResponse.data.token);

                    
                    // Redirect based on user type
                    const redirectPath = userType === 'student' ? '/student/home' : '/captain/home';
                    window.location.href = redirectPath;
                }
            }
        } 
        // 🔹 Handle Login
        else {
            const response = await axios.post(endpoint, formData);
            console.log("✅ Login Success:", response.data);

            if (response.status === 200) {
                // ✅ Fixed `localStorage.setItem()` syntax
                localStorage.setItem(`${userType}Token`, response.data.token);
                
                if (userType === "student") {

                  localStorage.setItem("studentEmail", formData.email);
                  
                  localStorage.setItem("studentData", JSON.stringify({        
                      first_name: response.data.first_name,
                      last_name: response.data.last_name,
                      registration_number: response.data.registration_number,
                      phone: response.data.phone,
                      route_name: response.data.route_name,
                      stop_name: response.data.stop_name,
                  }));
              }
                // Redirect user
                const redirectPath = userType === 'student' ? '/student/home' : '/captain/home';
                window.location.href = redirectPath;
            }
        }
    } catch (error) {
        console.error("❌ API Error:", error);

        if (error.response) {
            console.error("❌ Server Response:", error.response.data);
            setStatusMessage(error.response.data.message || "An error occurred. Please try again.");
        } else {
            setStatusMessage("⚠️ Network error. Please try again later.");
        }
    }
};



  return (
    <div className="min-h-screen bg-blue-200 flex flex-col items-center justify-between">
      {/* Navbar */}
      <nav className="w-full py-4 bg-blue-500 text-white text-center flex justify-around">
        <Link to="/landing-page" className="hover:underline">Home</Link>
        <Link to="/about" className="hover:underline">About</Link>
        <a href="/contact" className="hover:underline">Contact</a>
      </nav>

      {/* Welcome Section */}
      <div className="flex flex-col items-center mt-12">
        <img src="/1.png" alt="Logo" className="w-20 h-20" />
        <h1 className="text-3xl font-bold text-center text-blue-700 mt-4">
          Welcome to the Capital University of Science and Technology Transport Hub by VANit!
        </h1>

        {/* Buttons for Login and Student Registration */}
        <div className="mt-8 flex space-x-4">
          <button
            onClick={() => setShowUserTypePopup(true)}
            className="px-6 py-3 bg-blue-600 text-white font-semibold text-lg rounded-lg shadow-lg hover:bg-blue-700 focus:outline-none"
          >
            Login
          </button>

          <button
            onClick={() => navigate('/student-registration')}
            className="px-6 py-3 bg-green-600 text-white font-semibold text-lg rounded-lg shadow-lg hover:bg-green-700 focus:outline-none"
          >
            Student Registration
          </button>
        </div>
      </div>

      {/* User Type Selection Popup */}
      {showUserTypePopup && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg text-center">
            <h3 className="text-2xl font-semibold text-gray-800 mb-4">Login as</h3>
            <button
              onClick={() => handleUserTypeSelection('student')}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg m-2 hover:bg-blue-600"
            >
              Student Login
            </button>
            <button
              onClick={() => navigate('/captain-login')}
              className="px-4 py-2 bg-green-600 text-white rounded-lg m-2 hover:bg-green-700"
            >
              Captain Login
            </button>
            <button
              onClick={() => setShowUserTypePopup(false)}
              className="block mt-4 text-red-500 hover:underline"
            >
              Cancel
            </button>
            

          </div>
        </div>
      )}

      {/* Form Section */}
      {showLoginForm && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-8 rounded-lg shadow-lg w-80">
            <h2 className="text-2xl font-bold text-center mb-4 text-orange-500">
            {isLogin ? `${userType === 'student' ? 'Student' : 'Captain'} Login` : 'Sign Up'}

            </h2>
            <form className="space-y-4" onSubmit={handleSubmit}>
              {!isLogin && (
                <>
                  <div className="flex items-center border border-gray-300 rounded-lg p-2">
                    <FaUser className="text-gray-500 mr-2" />
                    <input
                      type="text"
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleChange}
                      placeholder="First Name"
                      className="flex-1 outline-none"
                      required
                    />
                  </div>
                  <div className="flex items-center border border-gray-300 rounded-lg p-2">
                    <FaUser className="text-gray-500 mr-2" />
                    <input
                      type="text"
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleChange}
                      placeholder="Last Name"
                      className="flex-1 outline-none"
                      required
                    />
                  </div>
                </>
              )}
              <div className="flex items-center border border-gray-300 rounded-lg p-2">
                <FaUser className="text-gray-500 mr-2" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Email Address"
                  className="flex-1 outline-none"
                  required
                />
              </div>
              <div className="flex items-center border border-gray-300 rounded-lg p-2">
                <FaLock className="text-gray-500 mr-2" />
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Password"
                  className="flex-1 outline-none"
                  required
                />
              </div>
              {!isLogin && userType === 'student' && (
                <div className="flex items-center border border-gray-300 rounded-lg p-2">
                  <FaUser className="text-gray-500 mr-2" />
                  <input
                    type="text"
                    name="registration_number"
                    value={formData.registration_number}
                    onChange={handleChange}
                    placeholder="Registration Number"
                    className="flex-1 outline-none"
                    required
                  />
                </div>
              )}
              {!isLogin && userType === 'captain' && (
                <div className="flex items-center border border-gray-300 rounded-lg p-2">
                  <FaUser className="text-gray-500 mr-2" />
                  <input
                    type="text"
                    name="bus_number"
                    value={formData.bus_number}
                    onChange={handleChange}
                    placeholder="Bus Number"
                    className="flex-1 outline-none"
                    required
                  />
                </div>
              )}
              <button type="submit" className="w-full py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700">
                {isLogin ? 'Sign In' : 'Sign Up'}
              </button>
            </form>
            {statusMessage && <p className="mt-4 text-center text-green-600">{statusMessage}</p>}
            <p onClick={switchForm} className="text-center text-blue-600 hover:underline cursor-pointer mt-2">
              {isLogin ? 'Don’t have an account? Sign Up' : 'Already have an account? Login'}
            </p>
            <button onClick={() => setShowLoginForm(false)} className="absolute top-2 right-2 text-gray-500 hover:text-gray-800">&times;</button>
          </div>
        </div>
      )}

      <footer className="mt-auto py-4 bg-blue-500 text-white w-full text-center">
        &copy; 2025 VANit! Transport Hub
      </footer>
    </div>
  );
};

export default LandingPage;

