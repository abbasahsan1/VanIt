import React, { useState, useEffect } from 'react';
import { FaExclamationTriangle, FaTimes, FaMapMarkerAlt, FaMedkit, FaShieldAlt, FaWrench, FaExclamationCircle } from 'react-icons/fa';
import axios from 'axios';

const SOSButton = ({ 
  userType = 'student', 
  userId, 
  userData = {}, 
  onAlertSent = () => {},
  disabled = false 
}) => {
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [selectedEmergencyType, setSelectedEmergencyType] = useState('general');
  const [customMessage, setCustomMessage] = useState('');
  const [priorityLevel, setPriorityLevel] = useState('high');

  // Emergency type options
  const emergencyTypes = [
    { value: 'medical', label: 'Medical Emergency', icon: FaMedkit, color: 'text-red-600', description: 'Medical help needed' },
    { value: 'security', label: 'Security Issue', icon: FaShieldAlt, color: 'text-orange-600', description: 'Safety or security concern' },
    { value: 'mechanical', label: 'Vehicle Issue', icon: FaWrench, color: 'text-blue-600', description: 'Bus breakdown or mechanical problem' },
    { value: 'general', label: 'General Emergency', icon: FaExclamationCircle, color: 'text-gray-600', description: 'Other emergency situation' }
  ];

  // Priority levels
  const priorityLevels = [
    { value: 'critical', label: 'CRITICAL', color: 'bg-red-600 text-white', description: 'Life-threatening emergency' },
    { value: 'high', label: 'HIGH', color: 'bg-orange-500 text-white', description: 'Urgent attention required' },
    { value: 'medium', label: 'MEDIUM', color: 'bg-yellow-500 text-white', description: 'Important but not urgent' },
    { value: 'low', label: 'LOW', color: 'bg-green-500 text-white', description: 'Non-urgent assistance' }
  ];

  // Get current GPS location
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
            accuracy: position.coords.accuracy
          };
          resolve(location);
        },
        (error) => {
          let errorMessage;
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location access denied by user';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information is unavailable';
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timed out';
              break;
            default:
              errorMessage = 'An unknown error occurred';
              break;
          }
          reject(new Error(errorMessage));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 30000
        }
      );
    });
  };

  // Fetch location when modal opens
  useEffect(() => {
    if (showModal) {
      setLocationError(null);
      getCurrentLocation()
        .then(location => {
          setCurrentLocation(location);
          console.log('📍 Current location obtained:', location);
        })
        .catch(error => {
          console.error('❌ Location error:', error);
          setLocationError(error.message);
        });
    }
  }, [showModal]);

  // Handle SOS submission
  const handleSOSSubmit = async () => {
    if (!userId || !userData.first_name || !userData.last_name) {
      alert('❌ User information is missing. Please refresh and try again.');
      return;
    }

    setIsLoading(true);

    try {
      // Prepare alert data
      const alertData = {
        user_type: userType,
        user_id: userId,
        first_name: userData.first_name,
        last_name: userData.last_name,
        registration_number: userType === 'student' ? userData.registration_number : null,
        phone: userData.phone || '',
        route_name: userData.route_name || '',
        stop_name: userType === 'student' ? userData.stop_name : null,
        latitude: currentLocation?.latitude || null,
        longitude: currentLocation?.longitude || null,
        emergency_type: selectedEmergencyType,
        message: customMessage.trim() || null,
        priority_level: priorityLevel
      };

      console.log('🚨 Sending SOS alert:', alertData);

      // Send SOS alert
      const response = await axios.post('http://localhost:5000/api/emergency/send-alert', alertData);

      if (response.data.success) {
        console.log('✅ SOS alert sent successfully:', response.data);
        
        // Close modal and show success
        setShowModal(false);
        
        // Show success message
        alert(`✅ SOS Alert Sent Successfully!\n\nAlert ID: ${response.data.alert_id}\nEmergency services have been notified and will respond shortly.`);
        
        // Reset form
        setSelectedEmergencyType('general');
        setCustomMessage('');
        setPriorityLevel('high');
        setCurrentLocation(null);
        
        // Notify parent component
        onAlertSent(response.data);
      } else {
        throw new Error(response.data.error || 'Failed to send alert');
      }

    } catch (error) {
      console.error('❌ Error sending SOS alert:', error);
      alert(`❌ Failed to send SOS alert: ${error.response?.data?.error || error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = () => {
    if (disabled) {
      alert('⚠️ SOS feature is currently disabled');
      return;
    }
    setShowModal(true);
  };

  const selectedType = emergencyTypes.find(type => type.value === selectedEmergencyType);
  const selectedPriority = priorityLevels.find(priority => priority.value === priorityLevel);

  return (
    <>
      {/* SOS Button */}
      <button
        onClick={handleOpenModal}
        disabled={disabled}
        className={`
          relative inline-flex items-center justify-center
          w-12 h-12 rounded-full transition-all duration-200
          ${disabled 
            ? 'bg-gray-400 cursor-not-allowed' 
            : 'bg-red-600 hover:bg-red-700 hover:scale-110 active:scale-95 cursor-pointer animate-pulse'
          }
          shadow-lg hover:shadow-xl
        `}
        title="Emergency SOS - Click for immediate help"
      >
        <FaExclamationTriangle className="text-white text-xl" />
        
        {/* Pulsing ring animation */}
        {!disabled && (
          <div className="absolute inset-0 rounded-full bg-red-600 animate-ping opacity-30"></div>
        )}
      </button>

      {/* SOS Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-md max-h-screen overflow-y-auto">
            
            {/* Modal Header */}
            <div className="bg-red-600 text-white p-4 rounded-t-lg flex items-center justify-between">
              <div className="flex items-center">
                <FaExclamationTriangle className="mr-3 text-2xl animate-pulse" />
                <div>
                  <h2 className="text-xl font-bold">🚨 EMERGENCY SOS</h2>
                  <p className="text-red-100 text-sm">Help is on the way</p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-white hover:text-red-200 text-2xl"
                disabled={isLoading}
              >
                <FaTimes />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4">
              
              {/* User Info Display */}
              <div className="bg-gray-50 p-3 rounded-lg">
                <h3 className="font-semibold text-gray-800 mb-2">Alert Information</h3>
                <div className="text-sm text-gray-600 space-y-1">
                  <p><strong>Name:</strong> {userData.first_name} {userData.last_name}</p>
                  <p><strong>Type:</strong> {userType.charAt(0).toUpperCase() + userType.slice(1)}</p>
                  {userType === 'student' && userData.registration_number && (
                    <p><strong>Registration:</strong> {userData.registration_number}</p>
                  )}
                  {userData.route_name && <p><strong>Route:</strong> {userData.route_name}</p>}
                  {userType === 'student' && userData.stop_name && (
                    <p><strong>Stop:</strong> {userData.stop_name}</p>
                  )}
                </div>
              </div>

              {/* GPS Location Status */}
              <div className="bg-blue-50 p-3 rounded-lg">
                <h3 className="font-semibold text-gray-800 mb-2 flex items-center">
                  <FaMapMarkerAlt className="mr-2 text-blue-600" />
                  Location Status
                </h3>
                {currentLocation ? (
                  <div className="text-sm text-gray-600">
                    <p className="text-green-600 font-medium">✅ Location acquired</p>
                    <p>Lat: {currentLocation.latitude.toFixed(6)}</p>
                    <p>Lng: {currentLocation.longitude.toFixed(6)}</p>
                    <p>Accuracy: ±{Math.round(currentLocation.accuracy)}m</p>
                  </div>
                ) : locationError ? (
                  <div className="text-sm">
                    <p className="text-red-600 font-medium">❌ Location unavailable</p>
                    <p className="text-gray-600">{locationError}</p>
                  </div>
                ) : (
                  <p className="text-sm text-yellow-600">📍 Getting location...</p>
                )}
              </div>

              {/* Emergency Type Selection */}
              <div>
                <h3 className="font-semibold text-gray-800 mb-3">Emergency Type</h3>
                <div className="grid grid-cols-2 gap-2">
                  {emergencyTypes.map((type) => {
                    const IconComponent = type.icon;
                    return (
                      <button
                        key={type.value}
                        onClick={() => setSelectedEmergencyType(type.value)}
                        className={`
                          p-3 rounded-lg border-2 transition-all text-left
                          ${selectedEmergencyType === type.value
                            ? 'border-red-500 bg-red-50'
                            : 'border-gray-200 hover:border-red-300'
                          }
                        `}
                      >
                        <div className="flex items-center mb-1">
                          <IconComponent className={`mr-2 ${type.color}`} />
                          <span className="font-medium text-sm text-gray-900">{type.label}</span>
                        </div>
                        <p className="text-xs text-gray-600">{type.description}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Priority Level */}
              <div>
                <h3 className="font-semibold text-gray-800 mb-3">Priority Level</h3>
                <div className="grid grid-cols-2 gap-2">
                  {priorityLevels.map((priority) => (
                    <button
                      key={priority.value}
                      onClick={() => setPriorityLevel(priority.value)}
                      className={`
                        p-2 rounded-lg text-sm font-medium transition-all
                        ${priorityLevel === priority.value
                          ? priority.color + ' ring-2 ring-offset-2 ring-gray-400'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }
                      `}
                    >
                      <div>{priority.label}</div>
                      <div className="text-xs opacity-80">{priority.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Message */}
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">Additional Information (Optional)</h3>
                <textarea
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  placeholder="Describe the emergency situation or any specific help needed..."
                  className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-900 bg-white placeholder-gray-500"
                  rows={3}
                  maxLength={500}
                />
                <p className="text-xs text-gray-500 mt-1">{customMessage.length}/500 characters</p>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => setShowModal(false)}
                  disabled={isLoading}
                  className="flex-1 px-4 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSOSSubmit}
                  disabled={isLoading || !userId}
                  className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 font-semibold"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Sending...
                    </div>
                  ) : (
                    '🚨 SEND SOS ALERT'
                  )}
                </button>
              </div>

              {/* Warning Message */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-xs text-yellow-800">
                  ⚠️ This will immediately alert emergency services and administrators. 
                  Only use for genuine emergencies. False alarms may result in penalties.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SOSButton;
