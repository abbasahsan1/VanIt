import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { FaHome, FaBus, FaUser, FaUsers, FaEdit, FaTrash, FaSignOutAlt, FaSave } from "react-icons/fa";

const EditStudent = () => {
  const [students, setStudents] = useState([]);
  const [editingStudent, setEditingStudent] = useState(null);
  const [updatedData, setUpdatedData] = useState({});

  // ✅ Fetch Student Data
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/admin/students");
        setStudents(response.data);
      } catch (error) {
        console.error("❌ Error fetching students:", error);
      }
    };
    fetchStudents();
  }, []);

  // ✅ Open Edit Form
  const handleEditClick = (student) => {
    if (!student.first_name) {
      console.error("❌ Student First Name is missing in selected student!");
      return;
    }
    setEditingStudent(student);
    setUpdatedData(student); // Fill form with selected student data
  };
  
  

  // ✅ Handle Input Change
  const handleChange = (e) => {
    setUpdatedData({ ...updatedData, [e.target.name]: e.target.value });
  };

  // ✅ Submit Updated Data
  const handleUpdate = async () => {
    if (!editingStudent || !editingStudent.first_name) {
      console.error("❌ Student First Name is missing!");
      return;
    }
  
    try {
      const response = await axios.put(
        `http://localhost:5000/api/admin/students/update/${editingStudent.first_name}`, 
        updatedData // Send edited student data
      );
  
      console.log("✅ Student Updated:", response.data);
      alert("Student updated successfully!");
  
      // Update Student List Without Reloading
      setStudents((prevStudents) =>
        prevStudents.map((student) =>
          student.first_name === editingStudent.first_name ? updatedData : student
        )
      );
  
      setEditingStudent(null); // Close the edit form
    } catch (error) {
      console.error("❌ Error updating student:", error);
      alert("Error updating student.");
    }
  };
  
  

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
          <Link to="/student-list" className="hover:text-blue-800 flex items-center">
            <FaUsers className="mr-1" /> Student List
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
          <h1 className="text-2xl font-bold text-blue-600 mb-4">Edit Student</h1>

          {students.length === 0 ? (
            <p className="text-gray-500">No students available for editing.</p>
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
                  <th className="border border-gray-300 p-2">Action</th>
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
                    <td className="border border-gray-300 p-2">
                      <button 
                        onClick={() => handleEditClick(student)} 
                        className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-700"
                      >
                        <FaEdit />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ✅ Edit Student Modal */}
            {/* ✅ Edit Student Modal */}
            {editingStudent && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96">
            <h2 className="text-xl font-bold mb-4 text-blue-600">Edit Student</h2>

            <input 
              type="text" 
              name="first_name" 
              value={updatedData.first_name} 
              onChange={handleChange} 
              className="w-full p-2 border rounded mb-3" 
              placeholder="First Name"
            />
            <input 
              type="text" 
              name="last_name" 
              value={updatedData.last_name} 
              onChange={handleChange} 
              className="w-full p-2 border rounded mb-3" 
              placeholder="Last Name"
            />
            <input 
              type="text" 
              name="registration_number" 
              value={updatedData.registration_number} 
              onChange={handleChange} 
              className="w-full p-2 border rounded mb-3" 
              placeholder="Registration Number"
            />
            <input 
              type="text" 
              name="semester" 
              value={updatedData.semester} 
              onChange={handleChange} 
              className="w-full p-2 border rounded mb-3" 
              placeholder="Semester"
            />
            <input 
              type="text" 
              name="phone" 
              value={updatedData.phone} 
              onChange={handleChange} 
              className="w-full p-2 border rounded mb-3" 
              placeholder="Phone Number"
            />
            <input 
              type="text" 
              name="emergency_contact" 
              value={updatedData.emergency_contact} 
              onChange={handleChange} 
              className="w-full p-2 border rounded mb-3" 
              placeholder="Emergency Contact"
            />
            <input 
              type="text" 
              name="address" 
              value={updatedData.address} 
              onChange={handleChange} 
              className="w-full p-2 border rounded mb-3" 
              placeholder="Address"
            />

            <button 
              onClick={handleUpdate} 
              className="bg-green-500 text-white px-4 py-2 rounded mr-3 hover:bg-green-700"
            >
              <FaSave /> Save
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditStudent;
