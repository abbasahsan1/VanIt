import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { FaHome, FaBus, FaUser, FaSignOutAlt, FaUsers, FaEdit, FaTrash } from "react-icons/fa";

const StudentList = () => {
  const [students, setStudents] = useState([]);

  // ✅ Fetch Student Data from API
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/admin/students");
        console.log("✅ Students API Response:", response.data);
        setStudents(response.data);
      } catch (error) {
        console.error("❌ Error fetching students:", error);
      }
    };

    fetchStudents();
  }, []);

  // ✅ Logout Function
  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen bg-[#B3D9FF] flex flex-col">
      
      {/* ✅ Navigation Bar */}
      <nav className="bg-white p-4 shadow-md flex justify-between items-center">
      <div className="flex items-center">
          <img src="/1.png" alt="Logo" className="w-12 h-12 mr-3" />
          <h1 className="text-orange-600 font-bold text-lg">Capital University of Science and Technology</h1>
        </div>
        <div className="flex space-x-8 text-blue-600 font-semibold text-lg">
          <Link to="/dashboard" className="hover:text-blue-800 flex items-center">
            <FaHome className="mr-1" /> Home
          </Link>
          <Link to="/routes" className="hover:text-blue-800 flex items-center">
            <FaBus className="mr-1" /> Routes
          </Link>
          <Link to="/captain-list" className="hover:text-blue-800 flex items-center">
            <FaUser className="mr-1" /> Captain List
          </Link>

          {/* ✅ Manage Student Dropdown */}
          <div className="relative group">
            <button className="hover:text-blue-800 flex items-center">
              <FaUsers className="mr-1" /> Manage Student ▼
            </button>
            <div className="absolute hidden group-hover:block bg-white shadow-md rounded-lg p-2 w-40">
              <Link to="/edit-student" className="block p-2 hover:bg-gray-200">
                <FaEdit className="mr-2" /> Edit Student
              </Link>
              <Link to="/delete-student" className="block p-2 hover:bg-gray-200">
                <FaTrash className="mr-2" /> Delete Student
              </Link>
            </div>
          </div>

          <button onClick={handleLogout} className="hover:text-red-600 flex items-center">
            <FaSignOutAlt className="mr-1" /> Logout
          </button>
        </div>
      </nav>

      {/* ✅ Student List Table */}
      <div className="p-10">
        <div className="bg-white shadow-lg rounded-lg p-6">
          <h1 className="text-2xl font-bold text-blue-600 mb-4">Student List</h1>

          {students.length === 0 ? (
            <p className="text-gray-500">No students registered yet.</p>
          ) : (
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-200">
                  <th className="border border-gray-300 p-2">First Name</th>
                  <th className="border border-gray-300 p-2">Last Name</th>
                  <th className="border border-gray-300 p-2">Reg. No.</th>
                  <th className="border border-gray-300 p-2">Semester</th>
                  <th className="border border-gray-300 p-2">Route</th>
                  <th className="border border-gray-300 p-2">Stop</th>
                  <th className="border border-gray-300 p-2">Phone</th>
                  <th className="border border-gray-300 p-2">Emergency Contact</th>
                  <th className="border border-gray-300 p-2">Address</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student, index) => (
                  <tr key={index} className="text-center">
                    <td className="border border-gray-300 p-2">{student.first_name}</td>
                    <td className="border border-gray-300 p-2">{student.last_name}</td>
                    <td className="border border-gray-300 p-2">{student.registration_number}</td>
                    <td className="border border-gray-300 p-2">{student.semester}</td>
                    <td className="border border-gray-300 p-2">{student.route_name}</td>
                    <td className="border border-gray-300 p-2">{student.stop_name}</td>
                    <td className="border border-gray-300 p-2">{student.phone}</td>
                    <td className="border border-gray-300 p-2">{student.emergency_contact}</td>
                    <td className="border border-gray-300 p-2">{student.address}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentList;
