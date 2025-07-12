import React, { useState, useEffect } from 'react';
import { FaExclamationTriangle, FaCheckCircle, FaClock, FaTimes, FaMapMarkerAlt, FaUser } from 'react-icons/fa';
import { io } from 'socket.io-client';
import axios from 'axios';

const SOSTracker = ({ 
  userType = 'student', 
  userId, 
  onClose = () => {} 
}) => {
  // Get userId from localStorage if not provided
  const actualUserId = userId || localStorage.getItem(userType === 'captain' ? 'captainId' : 'studentId');
  const [sosAlerts, setSosAlerts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [socket, setSocket] = useState(null);

  // Status mapping for display
  const statusConfig = {
    pending: { 
      icon: FaClock, 
      color: 'text-yellow-600', 
      bgColor: 'bg-yellow-50', 
      borderColor: 'border-yellow-200',
      label: 'Pending Response'
    },
    acknowledged: { 
      icon: FaCheckCircle, 
      color: 'text-blue-600', 
      bgColor: 'bg-blue-50', 
      borderColor: 'border-blue-200',
      label: 'Acknowledged'
    },
    resolved: { 
      icon: FaCheckCircle, 
      color: 'text-green-600', 
      bgColor: 'bg-green-50', 
      borderColor: 'border-green-200',
      label: 'Resolved'
    }
  };

  // Priority styling
  const priorityConfig = {
    critical: { color: 'text-red-700', label: 'CRITICAL' },
    high: { color: 'text-orange-600', label: 'HIGH' },
    medium: { color: 'text-yellow-600', label: 'MEDIUM' },
    low: { color: 'text-green-600', label: 'LOW' }
  };

  useEffect(() => {
    // Initialize WebSocket connection
    const newSocket = io('http://localhost:5000');
    setSocket(newSocket);

    // Join user-specific room for real-time updates
    newSocket.emit('subscribe_user_sos', { userType, userId: actualUserId });
    console.log(`📡 SOS Tracker subscribed for ${userType} ${actualUserId}`);      // Listen for real-time SOS updates
      newSocket.on('sos_status_update', (data) => {
        console.log('📊 SOS Tracker received status update:', data);
        
        // Show browser notification
        if (Notification.permission === 'granted') {
          new Notification('🚨 SOS Alert Update', {
            body: `Your emergency alert #${data.alertId} has been ${data.status}`,
            icon: '/favicon.ico'
          });
        }
        
        // Update the specific alert in the list
        setSosAlerts(prevAlerts => 
          prevAlerts.map(alert => 
            alert.id === data.alertId 
              ? { 
                  ...alert, 
                  status: data.status,
                  acknowledged_at: data.acknowledged_at || alert.acknowledged_at,
                  acknowledged_by: data.acknowledged_by || alert.acknowledged_by,
                  resolved_at: data.resolved_at || alert.resolved_at,
                  resolution_notes: data.resolution_notes || alert.resolution_notes
                }
              : alert
          )
        );
      });

    // Fetch user's SOS alerts
    fetchUserSOSAlerts();

    // Request notification permission
    if (Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        console.log('📲 Notification permission:', permission);
      });
    }

    return () => {
      if (newSocket) {
        newSocket.emit('unsubscribe_user_sos', { userType, userId: actualUserId });
        newSocket.disconnect();
      }
    };
  }, [userType, actualUserId]);

  const fetchUserSOSAlerts = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`http://localhost:5000/api/emergency/user/${userType}/${actualUserId}/alerts`);
      
      if (response.data.success) {
        setSosAlerts(response.data.data || []);
        console.log(`✅ Loaded ${response.data.data.length} SOS alerts for ${userType} ${actualUserId}`);
      }
    } catch (error) {
      console.error('❌ Error fetching user SOS alerts:', error);
      setSosAlerts([]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTimeAgo = (timestamp) => {
    if (!timestamp) return '';
    const now = new Date();
    const alertTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now - alertTime) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-2xl p-6 max-w-md w-full mx-4">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
            <span className="ml-3 text-gray-600">Loading your SOS alerts...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-screen overflow-hidden">
        
        {/* Header */}
        <div className="bg-red-600 text-white p-4 flex items-center justify-between">
          <div className="flex items-center">
            <FaExclamationTriangle className="mr-3 text-2xl" />
            <div>
              <h2 className="text-xl font-bold">🚨 My SOS Alerts</h2>
              <p className="text-red-100 text-sm">Live tracking of your emergency alerts</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-red-200 text-2xl"
          >
            <FaTimes />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-96 overflow-y-auto">
          {sosAlerts.length === 0 ? (
            <div className="text-center py-8">
              <FaCheckCircle className="mx-auto text-4xl text-green-500 mb-4" />
              <p className="text-gray-600 text-lg">No SOS alerts found</p>
              <p className="text-gray-500 text-sm">You haven't sent any emergency alerts yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {sosAlerts
                .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                .map((alert) => {
                  const statusInfo = statusConfig[alert.status] || statusConfig.pending;
                  const priorityInfo = priorityConfig[alert.priority_level] || priorityConfig.medium;
                  const StatusIcon = statusInfo.icon;
                  
                  return (
                    <div 
                      key={alert.id} 
                      className={`${statusInfo.bgColor} ${statusInfo.borderColor} border-2 rounded-lg p-4`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center">
                          <StatusIcon className={`${statusInfo.color} text-xl mr-2`} />
                          <div>
                            <h3 className="font-semibold text-gray-800">
                              Alert #{alert.id} - {statusInfo.label}
                            </h3>
                            <p className="text-sm text-gray-600">{formatTimestamp(alert.timestamp)}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${priorityInfo.color} bg-white`}>
                            {priorityInfo.label}
                          </span>
                          <p className="text-xs text-gray-500 mt-1">{getTimeAgo(alert.timestamp)}</p>
                        </div>
                      </div>

                      {/* Alert Details */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                        <div>
                          <p className="text-sm text-gray-600">
                            <strong>Type:</strong> {alert.emergency_type || 'General'}
                          </p>
                          <p className="text-sm text-gray-600">
                            <strong>Location:</strong> {alert.route_name || 'N/A'}
                            {alert.stop_name && ` - ${alert.stop_name}`}
                          </p>
                        </div>
                        <div>
                          {alert.latitude && alert.longitude && (
                            <p className="text-sm text-gray-600 flex items-center">
                              <FaMapMarkerAlt className="mr-1" />
                              GPS: {parseFloat(alert.latitude).toFixed(4)}, {parseFloat(alert.longitude).toFixed(4)}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Message */}
                      {alert.message && (
                        <div className="mb-3">
                          <p className="text-sm text-gray-600">
                            <strong>Message:</strong> {alert.message}
                          </p>
                        </div>
                      )}

                      {/* Status Timeline */}
                      <div className="border-t pt-3 space-y-2">
                        {/* Sent */}
                        <div className="flex items-center text-sm">
                          <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                          <span className="text-gray-600">
                            <strong>Sent:</strong> {formatTimestamp(alert.timestamp)}
                          </span>
                        </div>

                        {/* Acknowledged */}
                        {alert.acknowledged_at && (
                          <div className="flex items-center text-sm">
                            <div className="w-2 h-2 bg-yellow-500 rounded-full mr-3"></div>
                            <span className="text-gray-600">
                              <strong>Acknowledged:</strong> {formatTimestamp(alert.acknowledged_at)}
                              {alert.acknowledged_by && (
                                <span className="ml-2 text-gray-500">
                                  by {alert.acknowledged_by}
                                </span>
                              )}
                            </span>
                          </div>
                        )}

                        {/* Resolved */}
                        {alert.resolved_at && (
                          <div className="flex items-center text-sm">
                            <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                            <span className="text-gray-600">
                              <strong>Resolved:</strong> {formatTimestamp(alert.resolved_at)}
                            </span>
                          </div>
                        )}

                        {/* Resolution Notes */}
                        {alert.resolution_notes && (
                          <div className="ml-5 bg-white rounded p-2 text-sm">
                            <strong className="text-gray-700">Resolution Notes:</strong>
                            <p className="text-gray-600 mt-1">{alert.resolution_notes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center text-sm text-gray-600">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
            <span>Live updates enabled</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default SOSTracker;
