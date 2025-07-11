import React, { useState, useEffect } from 'react';
import { FaUsers, FaQrcode, FaCheckCircle, FaClock, FaRedo, FaPlay, FaStop } from 'react-icons/fa';
import axios from 'axios';
import { io } from 'socket.io-client';

const CaptainAttendancePanel = ({ captainId, routeName }) => {
  const [boardingSession, setBoardingSession] = useState(null);
  const [attendanceCount, setAttendanceCount] = useState(0);
  const [recentScans, setRecentScans] = useState([]);
  const [sessionActive, setSessionActive] = useState(false);
  const [socket, setSocket] = useState(null);
  const [qrCode, setQrCode] = useState(null);
  const [qrExpiry, setQrExpiry] = useState(null);

  useEffect(() => {
    // Initialize socket connection
    const newSocket = io('http://localhost:5000');
    setSocket(newSocket);

    // Join captain room for real-time updates
    if (captainId) {
      newSocket.emit('join-captain-room', captainId);
    }

    // Listen for attendance updates
    newSocket.on('attendance-update', (data) => {
      if (data.route_name === routeName) {
        setRecentScans(prev => [data, ...prev.slice(0, 4)]); // Keep last 5 scans
        setAttendanceCount(prev => prev + 1);
        
        // Show notification
        showNotification(`${data.student_name} boarded the bus`, 'success');
      }
    });

    // Listen for session updates
    newSocket.on('session-update', (data) => {
      if (data.route_name === routeName) {
        setBoardingSession(data);
        setSessionActive(data.status === 'active');
      }
    });

    return () => {
      newSocket.disconnect();
    };
  }, [captainId, routeName]);

  const startBoardingSession = async () => {
    try {
      const response = await axios.post('http://localhost:5000/api/attendance/start-session', {
        captainId,
        routeName
      });
      
      setBoardingSession(response.data.session);
      setQrCode(response.data.qrCode);
      setQrExpiry(new Date(response.data.expiresAt));
      setSessionActive(true);
      setAttendanceCount(0);
      setRecentScans([]);
      
      showNotification('Boarding session started successfully!', 'success');
    } catch (error) {
      console.error('Error starting session:', error);
      showNotification('Failed to start boarding session', 'error');
    }
  };

  const endBoardingSession = async () => {
    try {
      await axios.post('http://localhost:5000/api/attendance/end-session', {
        sessionId: boardingSession?.id
      });
      
      setBoardingSession(null);
      setSessionActive(false);
      setQrCode(null);
      setQrExpiry(null);
      
      showNotification('Boarding session ended successfully!', 'success');
    } catch (error) {
      console.error('Error ending session:', error);
      showNotification('Failed to end boarding session', 'error');
    }
  };

  const refreshQRCode = async () => {
    if (!sessionActive || !boardingSession) return;
    
    try {
      const response = await axios.post('http://localhost:5000/api/attendance/refresh-qr', {
        sessionId: boardingSession.id
      });
      
      setQrCode(response.data.qrCode);
      setQrExpiry(new Date(response.data.expiresAt));
      
      showNotification('QR Code refreshed!', 'success');
    } catch (error) {
      console.error('Error refreshing QR code:', error);
      showNotification('Failed to refresh QR code', 'error');
    }
  };

  const showNotification = (message, type) => {
    // Create a simple notification (you can enhance this with a proper notification library)
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 p-4 rounded-lg z-50 ${
      type === 'success' ? 'bg-green-500' : 'bg-red-500'
    } text-white shadow-lg transition-all duration-300`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.opacity = '0';
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300);
    }, 3000);
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getTimeRemaining = () => {
    if (!qrExpiry) return '';
    
    const now = new Date();
    const remaining = Math.max(0, Math.floor((qrExpiry - now) / 1000));
    const minutes = Math.floor(remaining / 60);
    const seconds = remaining % 60;
    
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
        <FaUsers className="mr-3 text-blue-600" />
        Attendance Management
      </h2>

      {/* Session Controls */}
      <div className="mb-6">
        {!sessionActive ? (
          <button
            onClick={startBoardingSession}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center"
          >
            <FaPlay className="mr-2" />
            Start Boarding Session
          </button>
        ) : (
          <div className="space-y-4">
            <button
              onClick={endBoardingSession}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center"
            >
              <FaStop className="mr-2" />
              End Boarding Session
            </button>
            
            {qrCode && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-lg font-semibold text-gray-800">QR Code for Boarding</h3>
                  <button
                    onClick={refreshQRCode}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm flex items-center"
                  >
                    <FaRedo className="mr-1" />
                    Refresh
                  </button>
                </div>
                
                <div className="text-center">
                  <div className="bg-white p-4 rounded-lg border-2 border-dashed border-gray-300 mb-3">
                    <FaQrcode className="text-6xl text-gray-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">QR Code Active</p>
                    <p className="text-xs text-gray-500">Expires in: {getTimeRemaining()}</p>
                  </div>
                  <p className="text-sm text-gray-600">
                    Students can scan this QR code to mark attendance
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Attendance Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center">
            <FaUsers className="text-2xl text-blue-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Students Boarded</p>
              <p className="text-2xl font-bold text-blue-600">{attendanceCount}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="flex items-center">
            <FaCheckCircle className="text-2xl text-green-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Session Status</p>
              <p className={`text-lg font-bold ${sessionActive ? 'text-green-600' : 'text-gray-600'}`}>
                {sessionActive ? 'Active' : 'Inactive'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Attendance */}
      {recentScans.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
            <FaClock className="mr-2 text-gray-600" />
            Recent Boardings
          </h3>
          
          <div className="space-y-2">
            {recentScans.map((scan, index) => (
              <div
                key={index}
                className="bg-gray-50 p-3 rounded-lg flex justify-between items-center"
              >
                <div>
                  <p className="font-medium text-gray-800">{scan.student_name}</p>
                  <p className="text-sm text-gray-600">ID: {scan.student_registration}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">{formatTime(scan.scan_timestamp)}</p>
                  <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                    <FaCheckCircle className="mr-1" />
                    Boarded
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CaptainAttendancePanel;
