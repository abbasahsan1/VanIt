import React, { useState, useEffect } from 'react';
import { FaBars, FaBell, FaUserCircle, FaSignOutAlt, FaArrowLeft, FaRobot, FaQrcode, FaExclamationTriangle, FaMapMarkedAlt, FaHistory } from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import axios from "axios";
import QRScanner from './QRScanner';
import AttendanceHistory from './AttendanceHistory';
import SOSButton from './SOSButton';
import SOSTracker from './SOSTracker';
import NotificationManager from './NotificationManager';

const StudentPortal = () => {
  const [showSidebar, setShowSidebar] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [showAttendanceHistory, setShowAttendanceHistory] = useState(false);
  const [showSOSTracker, setShowSOSTracker] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const navigate = useNavigate();
  const [socket, setSocket] = useState(null);
  const [studentData, setStudentData] = useState({ first_name: '', registration_number: '', id: null });

  const toggleSidebar = () => {
    setShowSidebar(!showSidebar);
    if (showProfileDropdown) setShowProfileDropdown(false);
  };

  const toggleProfileDropdown = () => {
    setShowProfileDropdown(!showProfileDropdown);
    if (showSidebar) setShowSidebar(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('studentToken');
    navigate('/landing-page');
  };

  useEffect(() => {
    // Initialize socket connection
    const newSocket = io('http://localhost:5000');
    setSocket(newSocket);

    const fetchStudentData = async () => {
      const email = localStorage.getItem("studentEmail");
      if (!email) return;
  
      try {
        const res = await axios.post("http://localhost:5000/api/get-student-by-email", { email });
        if (res.status === 200) {
          setStudentData({
            id: res.data.id,
            first_name: res.data.first_name,
            last_name: res.data.last_name || '',
            registration_number: res.data.registration_number,
            route_name: res.data.route_name,
            stop_name: res.data.stop_name,
            phone: res.data.phone || '',
            emergency_contact: res.data.emergency_contact || ''
          });
          console.log('✅ Student data loaded for SOS:', res.data);
        }
      } catch (err) {
        console.error("Error fetching student data:", err);
      }
    };
  
    fetchStudentData();

    return () => {
      if (newSocket) {
        newSocket.disconnect();
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-blue-200">
      <nav className="bg-blue-500 p-4 flex justify-between items-center text-white">
        <FaBars
          className="text-3xl cursor-pointer hover:text-gray-300"
          onClick={toggleSidebar}
        />

        <div className="text-2xl font-bold">VANit! Student Portal</div>

        <div className="flex items-center space-x-4">
          <Link to="/student/bus-tracking">
            <FaMapMarkedAlt className="text-xl text-blue-300 cursor-pointer hover:text-white transition-colors duration-200" title="Track My Bus" />
          </Link>

          {/* SOS Button */}
          <SOSButton 
            userType="student"
            userId={studentData.id}
            userData={studentData}
            onAlertSent={(alertData) => {
              console.log('SOS Alert sent from Student Portal:', alertData);
              // Optionally show a notification or update UI
            }}
          />

          {/* SOS Tracker Button */}
          <button
            onClick={() => setShowSOSTracker(true)}
            className="text-xl text-blue-300 cursor-pointer hover:text-white transition-colors duration-200"
            title="View My SOS Alerts"
          >
            <FaHistory />
          </button>

          <FaBell className="text-xl cursor-pointer hover:text-gray-300" />

          <div className="relative">
            <FaUserCircle
              className="text-3xl cursor-pointer hover:text-gray-300"
              onClick={toggleProfileDropdown}
            />
            {showProfileDropdown && (
              <div className="absolute right-0 mt-2 w-40 bg-white text-gray-800 shadow-lg rounded-lg">
                <Link
                  to="/student/profile"
                  className="block px-4 py-2 hover:bg-gray-200 items-center"
                >
                  <FaUserCircle className="mr-2" /> Profile
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 hover:bg-gray-200 flex items-center"
                >
                  <FaSignOutAlt className="mr-2" /> Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      <div
        className={`fixed top-0 left-0 h-full bg-blue-100 shadow-lg transition-transform duration-300 ${
          showSidebar ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ width: '250px' }}
      >
        <div className="p-4 flex justify-end">
          <FaArrowLeft
            className="text-2xl text-blue-700 cursor-pointer hover:text-blue-900"
            onClick={toggleSidebar}
          />
        </div>

        <div className="p-4">
          <div className="flex items-center mb-6">
            <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center">
              <FaUserCircle size={24} />
            </div>
            <div className="ml-4">
              <p className="font-bold">{studentData.first_name}</p>
              <p className="text-sm text-gray-600">{studentData.registration_number}</p>
            </div>
          </div>

          <ul className="space-y-4">
            <li>
              <Link to="/student/home" className="flex items-center text-lg text-blue-700 hover:underline">
                <FaUserCircle className="mr-2" /> Home Page
              </Link>
            </li>
            <li>
              <Link to="/student/profile" className="flex items-center text-lg text-blue-700 hover:underline">
                <FaUserCircle className="mr-2" /> Profile
              </Link>
            </li>
            <li>
              <Link to="/student/attendance" className="flex items-center text-lg text-blue-700 hover:underline">
                <FaHistory className="mr-2" /> Attendance History
              </Link>
            </li>
            <li>
              <button 
                onClick={() => setShowQRScanner(true)}
                className="flex items-center text-lg text-blue-700 hover:underline w-full text-left"
              >
                <FaQrcode className="mr-2" /> Scan QR Code
              </button>
            </li>
            <li>
              <Link to="/student/routes" className="flex items-center text-lg text-blue-700 hover:underline">
                <FaUserCircle className="mr-2" /> Routes
              </Link>
            </li>
            <li>
              <Link to="/student/bus-tracking" className="flex items-center text-lg text-blue-700 hover:underline">
                <FaUserCircle className="mr-2" /> My Bus
              </Link>
            </li>
            <li>
              <Link to="/student/feedback" className="flex items-center text-lg text-blue-700 hover:underline">
                <FaUserCircle className="mr-2" /> Feedback
              </Link>
            </li>
            <li>
              <Link to="/student/invoices" className="flex items-center text-lg text-blue-700 hover:underline">
                <FaUserCircle className="mr-2" /> Invoices
              </Link>
            </li>
            <li>
              <Link to="/student/notifications" className="flex items-center text-lg text-blue-700 hover:underline">
                <FaUserCircle className="mr-2" /> Notifications
              </Link>
            </li>
            <li>
              <Link to="/student/emergency" className="flex items-center text-lg text-blue-700 hover:underline">
                <FaUserCircle className="mr-2" /> Emergency Button
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="p-8 flex justify-center">
        {activeTab === 'dashboard' && (
          <div className="bg-white shadow-lg rounded-lg p-10 w-3/4 flex justify-between items-center">
          <div className="flex flex-col items-center">
            <FaQrcode className="text-6xl text-orange-500" />
            <p className="text-orange-600 mt-2">Scan Here</p>
          </div>

          <div className="text-center flex-1 mx-8">
            <h1 className="text-3xl font-bold text-blue-800">Welcome to the Student Portal</h1>
            <p className="text-lg text-gray-800">
              <strong>Selected Route:</strong> {studentData.route_name || 'N/A'}
            </p>
            <p className="text-lg text-gray-800">
              <strong>Selected Stop:</strong> {studentData.stop_name || 'N/A'}
            </p>
            
            <div className="mt-6 space-y-4">
              <Link 
                to="/student/bus-tracking" 
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 shadow-lg hover:shadow-xl w-full md:w-auto justify-center"
              >
                <FaMapMarkedAlt className="text-2xl mr-3" />
                <span className="text-lg font-semibold">Track My Bus</span>
              </Link>
              <p className="text-sm text-gray-600 mt-2">Click to view live bus location and tracking</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                <button
                  onClick={() => setActiveTab('qr-scanner')}
                  className={`inline-flex items-center px-6 py-3 rounded-lg transition-colors duration-200 shadow-lg hover:shadow-xl w-full justify-center ${
                    activeTab === 'qr-scanner' 
                      ? 'bg-green-600 text-white hover:bg-green-700' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  <FaQrcode className="text-2xl mr-3" />
                  <span className="text-lg font-semibold">Scan QR Code</span>
                </button>
                
                <button
                  onClick={() => setActiveTab('attendance-history')}
                  className={`inline-flex items-center px-6 py-3 rounded-lg transition-colors duration-200 shadow-lg hover:shadow-xl w-full justify-center ${
                    activeTab === 'attendance-history' 
                      ? 'bg-purple-600 text-white hover:bg-purple-700' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  <FaHistory className="text-2xl mr-3" />
                  <span className="text-lg font-semibold">Attendance History</span>
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center">
            <div className="bg-white shadow-lg p-3 rounded-full">
              <FaRobot
                className="text-5xl text-orange-500 cursor-pointer hover:text-orange-700"
                title="Chatbot"
              />
            </div>
          </div>
        </div>
        )}
        
        {/* Attendance Features */}
        {activeTab === 'qr-scanner' && (
          <div className="mt-8">
            <div className="flex items-center mb-4">
              <button
                onClick={() => setActiveTab('dashboard')}
                className="flex items-center text-blue-600 hover:text-blue-800 font-medium"
              >
                <FaArrowLeft className="mr-2" />
                Back to Dashboard
              </button>
            </div>
            <QRScanner 
              studentId={studentData.id} 
              onClose={() => setActiveTab('dashboard')}
              onScanSuccess={(data) => {
                console.log('QR scan successful:', data);
                // Optionally show a success message or update UI
              }}
            />
          </div>
        )}
        
        {activeTab === 'attendance-history' && (
          <div className="mt-8">
            <div className="flex items-center mb-4">
              <button
                onClick={() => setActiveTab('dashboard')}
                className="flex items-center text-blue-600 hover:text-blue-800 font-medium"
              >
                <FaArrowLeft className="mr-2" />
                Back to Dashboard
              </button>
            </div>
            <AttendanceHistory studentId={studentData.id} />
          </div>
        )}
      </div>

      {/* Notification Manager */}
      <NotificationManager 
        socket={socket}
        userType="student"
        userId={studentData.id}
      />

      {/* SOS Tracker Modal */}
      {showSOSTracker && (
        <SOSTracker 
          userType="student"
          userId={studentData.id}
          onClose={() => setShowSOSTracker(false)}
        />
      )}
    </div>
  );
};

export default StudentPortal;
