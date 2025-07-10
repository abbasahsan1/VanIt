
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  FaUserCircle,
  FaHome,
  FaBus,
  FaUsers,
  FaPlus,
  FaEdit,
} from "react-icons/fa";

const AddCaptain = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    dob: "",
    cnic: "",
    cnic_picture: null,
    driving_license: "",
    driving_license_picture: null,
    phone: "",
    alternate_phone: "",
    email: "",
    address: "",
    route: "",
    bus_no: "",
  });

  const [routes, setRoutes] = useState([]);

  useEffect(() => {
    axios
      .get("http://localhost:5000/api/routes")
      .then((response) => setRoutes(Object.keys(response.data)))
      .catch((error) => console.error("❌ Error fetching routes:", error));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    setFormData({ ...formData, [name]: files[0] });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const data = new FormData();
      Object.keys(formData).forEach((key) => {
        data.append(key, formData[key]);
      });

      await axios.post("http://localhost:5000/api/admin/captains", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      alert("✅ Captain added successfully!");
      navigate("/captain-list"); // Redirect to Captain List
    } catch (error) {
      console.error("❌ Error adding captain:", error);
      alert("Error adding captain.");
    }
  };

  return (
    <div className="min-h-screen bg-[#B3D9FF] flex flex-col">
      {/* ✅ Navigation Bar */}
      <nav className="bg-white p-4 shadow-md flex justify-between items-center">
        <div className="flex items-center">
          <img src="/1.png" alt="Logo" className="w-12 h-12 mr-3" />
          <h1 className="text-orange-600 font-bold text-lg">
            Capital University of Science and Technology
          </h1>
        </div>
        <div className="flex space-x-8 text-blue-600 font-semibold text-lg">
          <Link to="/dashboard" className="hover:text-blue-800 flex items-center">
            <FaHome className="mr-1" /> Home
          </Link>
          <Link to="/routes" className="hover:text-blue-800 flex items-center">
            <FaBus className="mr-1" /> Routes
          </Link>
          <Link to="/student-list" className="hover:text-blue-800 flex items-center">
            <FaUsers className="mr-1" /> Student List
          </Link>
          <div className="relative group">
            <button className="hover:text-blue-800 flex items-center">
              <FaUsers className="mr-1" /> Manage Captains ▼
            </button>
            <div className="absolute hidden group-hover:block bg-white shadow-md rounded-lg p-2 w-40">
              <Link to="/add-captain" className="block p-2 hover:bg-gray-200">
                <FaPlus className="mr-2" /> Add Captain
              </Link>
              <Link to="/edit-captain" className="block p-2 hover:bg-gray-200">
                <FaEdit className="mr-2" /> Edit Captain
              </Link>
            </div>
          </div>
          <button className="hover:text-blue-800">Logout</button>
        </div>
        <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
          <FaUserCircle className="text-gray-600 text-2xl" />
        </div>
      </nav>

      {/* ✅ Add Captain Form */}
      <div className="flex justify-center py-10">
        <div className="w-full max-w-4xl bg-white shadow-lg rounded-xl p-8">
          <h1 className="text-3xl font-extrabold text-center text-orange-500 mb-6">
            Add Captain
          </h1>
          <form onSubmit={handleSubmit} encType="multipart/form-data">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <input
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                placeholder="First Name"
                required
                className="w-full p-3 border border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-400"
              />
              <input
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                placeholder="Last Name"
                required
                className="w-full p-3 border border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-400"
              />
            </div>

            <input
              type="date"
              name="dob"
              value={formData.dob}
              onChange={handleChange}
              required
              className="w-full p-3 mb-6 border border-orange-300 rounded-lg"
            />

            <input
              type="text"
              name="cnic"
              value={formData.cnic}
              onChange={handleChange}
              placeholder="CNIC"
              required
              className="w-full p-3 mb-6 border border-orange-300 rounded-lg"
            />
            <input
              type="file"
              name="cnic_picture"
              onChange={handleFileChange}
              required
              className="w-full p-3 mb-6 border border-orange-300 rounded-lg"
            />

            <input
              type="text"
              name="driving_license"
              value={formData.driving_license}
              onChange={handleChange}
              placeholder="Driving License"
              required
              className="w-full p-3 mb-6 border border-orange-300 rounded-lg"
            />
            <input
              type="file"
              name="driving_license_picture"
              onChange={handleFileChange}
              required
              className="w-full p-3 mb-6 border border-orange-300 rounded-lg"
            />

            <input
              type="text"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="Phone Number"
              required
              className="w-full p-3 mb-6 border border-orange-300 rounded-lg"
            />
            <input
              type="text"
              name="alternate_phone"
              value={formData.alternate_phone}
              onChange={handleChange}
              placeholder="Alternate Phone Number"
              className="w-full p-3 mb-6 border border-orange-300 rounded-lg"
            />

            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Email"
              required
              className="w-full p-3 mb-6 border border-orange-300 rounded-lg"
            />

            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="Address"
              required
              className="w-full p-3 mb-6 border border-orange-300 rounded-lg"
            />

            <select
              name="route"
              value={formData.route}
              onChange={handleChange}
              required
              className="w-full p-3 border border-orange-300 rounded-lg"
            >
              <option value="">Select Route</option>
              {routes.map((route) => (
                <option key={route} value={route}>
                  {route}
                </option>
              ))}
            </select>
            <input
    type="text"
    name="bus_no"
    value={formData.bus_no}
    onChange={handleChange}
    placeholder="Enter Bus Number"
    required
    className="w-full p-3 mb-6 border border-orange-300 rounded-lg"
/>

            <button type="submit" className="w-full py-3 bg-orange-500 text-white font-bold rounded-lg hover:bg-orange-600">
              Submit
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddCaptain;

