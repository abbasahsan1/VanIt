import React, { useState, useEffect } from 'react';
import { FaCheckCircle, FaTimes, FaExclamationTriangle } from 'react-icons/fa';

const NotificationManager = ({ socket, userType, userId }) => {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (!socket || !userId) return;

    // Listen for SOS status updates
    socket.on('sos_status_update', (data) => {
      console.log('📲 Received SOS status update:', data);
      
      // Create notification
      const notification = {
        id: Date.now(),
        type: 'sos_update',
        title: '🚨 SOS Alert Update',
        message: `Your emergency alert #${data.alertId} has been ${data.status}`,
        status: data.status,
        timestamp: new Date(),
        alertId: data.alertId
      };

      setNotifications(prev => [notification, ...prev.slice(0, 4)]); // Keep max 5 notifications

      // Show browser notification if permission granted
      if (Notification.permission === 'granted') {
        new Notification(notification.title, {
          body: notification.message,
          icon: '/favicon.ico',
          tag: `sos-${data.alertId}` // Prevent duplicate notifications
        });
      }

      // Auto-dismiss after 10 seconds
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== notification.id));
      }, 10000);
    });

    return () => {
      if (socket) {
        socket.off('sos_status_update');
      }
    };
  }, [socket, userId]);

  const dismissNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'acknowledged': return 'bg-yellow-500';
      case 'resolved': return 'bg-green-500';
      default: return 'bg-blue-500';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'acknowledged': return FaExclamationTriangle;
      case 'resolved': return FaCheckCircle;
      default: return FaExclamationTriangle;
    }
  };

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {notifications.map((notification) => {
        const StatusIcon = getStatusIcon(notification.status);
        return (
          <div
            key={notification.id}
            className={`${getStatusColor(notification.status)} text-white p-4 rounded-lg shadow-lg max-w-sm animate-slide-in`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start">
                <StatusIcon className="text-xl mr-3 mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-sm">{notification.title}</h4>
                  <p className="text-sm opacity-90 mt-1">{notification.message}</p>
                  <p className="text-xs opacity-75 mt-2">
                    {notification.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
              <button
                onClick={() => dismissNotification(notification.id)}
                className="text-white hover:text-gray-200 ml-2 flex-shrink-0"
              >
                <FaTimes />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default NotificationManager;
