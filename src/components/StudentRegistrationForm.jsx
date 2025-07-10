import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaTimes } from 'react-icons/fa';

const StudentRegistrationForm = () => {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    registration_number: '',
    semester: '',
    route_name: '',
    stop_name: '',
    phone: '',
    emergency_contact: '',
    address: '',
  });

  const [routes, setRoutes] = useState([]);
  const [selectedRoute, setSelectedRoute] = useState('');
  const [stops, setStops] = useState([]);
  const navigate = useNavigate();

  // ✅ Fetch Routes & Stops (Using Route Name as Key)
  useEffect(() => {
    const fetchRoutesAndStops = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/routes');
        console.log("✅ Routes API Response:", response.data);

        if (typeof response.data === "object") {
          setRoutes(response.data);
        } else {
          console.error("❌ Unexpected API format:", response.data);
          setRoutes({});
        }
      } catch (error) {
        console.error('❌ Error fetching routes:', error);
      }
    };

    fetchRoutesAndStops();
  }, []);

  // ✅ Handle Input Change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // ✅ Handle Route Selection
  const handleRouteChange = (e) => {
    const routeName = e.target.value;
    setSelectedRoute(routeName);
    setStops([]); // Reset stops when changing route
    setFormData({ ...formData, route_name: routeName, stop_name: '' });

    // ✅ Load stops based on selected route
    if (routes[routeName]) {
      setStops(routes[routeName]);
    }
  };

  // ✅ Handle Form Submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.route_name || !formData.stop_name) {
      alert("❌ Please select a valid route and stop.");
      return;
    }

    try {
      await axios.post('http://localhost:5000/api/student-registration', formData);
      alert('✅ Registration form submitted successfully!');
      navigate('/landing-page');
    } catch (error) {
      console.error('❌ Error submitting form:', error);
      alert("❌ Registration Failed!");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-200 to-blue-400 flex items-center justify-center py-10">
      <div className="w-full max-w-4xl bg-white shadow-lg rounded-xl p-8 relative">
        {/* Close Button */}
        <FaTimes 
          onClick={() => navigate('/landing-page')} 
          className="text-gray-600 hover:text-gray-900 absolute top-4 right-4 cursor-pointer text-2xl"
        />

        <h1 className="text-3xl font-extrabold text-center text-orange-500 mb-6">
          Student Registration Form
        </h1>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <input
              type="text"
              name="first_name"
              value={formData.first_name}
              onChange={handleChange}
              placeholder="First Name"
              required
              className="w-full p-3 border border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
            <input
              type="text"
              name="last_name"
              value={formData.last_name}
              onChange={handleChange}
              placeholder="Last Name"
              required
              className="w-full p-3 border border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Email"
              required
              className="w-full p-3 border border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
            <input
              type="text"
              name="registration_number"
              value={formData.registration_number}
              onChange={handleChange}
              placeholder="Registration Number"
              required
              className="w-full p-3 border border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>

          <input
            type="text"
            name="semester"
            value={formData.semester}
            onChange={handleChange}
            placeholder="Semester"
            required
            className="w-full p-3 mb-6 border border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* ✅ Route Dropdown */}
            <select
              name="route_name"
              value={formData.route_name}
              onChange={handleRouteChange}
              required
              className="w-full p-3 border border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
            >
              <option value="">Select Route</option>
              {Object.keys(routes).map(routeName => (
                <option key={routeName} value={routeName}>
                  {routeName}
                </option>
              ))}
            </select>

            {/* ✅ Stop Dropdown */}
            <select
              name="stop_name"
              value={formData.stop_name}
              onChange={handleChange}
              required
              className="w-full p-3 border border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
            >
              <option value="">Select Stop</option>
              {stops.map(stop => (
                <option key={stop.stop_id} value={stop.stop_name}>
                  {stop.stop_name}
                </option>
              ))}
            </select>
          </div>

          <input
            type="text"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="Phone Number"
            required
            className="w-full p-3 mb-6 border border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
          <input
            type="text"
            name="emergency_contact"
            value={formData.emergency_contact}
            onChange={handleChange}
            placeholder="Emergency Contact"
            required
            className="w-full p-3 mb-6 border border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
          <textarea
            name="address"
            value={formData.address}
            onChange={handleChange}
            placeholder="Address"
            required
            className="w-full p-3 mb-6 border border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
          />

          <button
            type="submit"
            className="w-full py-3 bg-orange-500 text-white font-bold rounded-lg shadow-md hover:bg-orange-600 transition duration-200"
          >
            Submit Registration
          </button>
        </form>
      </div>
    </div>
  );
};

export default StudentRegistrationForm;
