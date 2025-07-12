import React, { useState, useEffect } from 'react';
import { 
  FaExclamationTriangle, 
  FaTimes, 
  FaMapMarkerAlt, 
  FaClock, 
  FaUser, 
  FaRoute, 
  FaPhone, 
  FaCheckCircle, 
  FaTimesCircle,
  FaEye,
  FaFilter,
  FaDownload,
  FaSync,
  FaHome,
  FaBell,
  FaUserCircle,
  FaSearch,
  FaSortUp,
  FaSortDown,
  FaSort
} from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import io from 'socket.io-client';

const EmergencyManager = () => {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState([]);
  const [filteredAlerts, setFilteredAlerts] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [acknowledging, setAcknowledging] = useState(false);
  const [resolving, setResolving] = useState(false);
  
  // Filters and search
  const [filters, setFilters] = useState({
    status: 'all',
    userType: 'all',
    priority: 'all',
    dateRange: 'all'
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'timestamp', direction: 'desc' });

  useEffect(() => {
    initializeData();
    setupWebSocket();

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, []);

  useEffect(() => {
    applyFiltersAndSearch();
  }, [alerts, filters, searchTerm, sortConfig]);

  const setupWebSocket = () => {
    const newSocket = io('http://localhost:5000');
    
    newSocket.on('connect', () => {
      console.log('✅ Emergency Manager WebSocket connected');
      newSocket.emit('subscribe_admin');
    });

    newSocket.on('emergency_alert', (data) => {
      console.log('🚨 New emergency alert received:', data);
      
      // Check if alert already exists to prevent duplicates
      setAlerts(prevAlerts => {
        const exists = prevAlerts.some(alert => alert.id === data.data.id);
        if (exists) {
          console.log('⚠️ Duplicate alert detected, skipping:', data.data.id);
          return prevAlerts;
        }
        return [data.data, ...prevAlerts];
      });
      
      fetchStats(); // Refresh stats
      showNotification(`New ${data.data.priority_level} priority alert from ${data.data.first_name} ${data.data.last_name}`, 'error');
    });

    newSocket.on('emergency_acknowledged', (data) => {
      console.log('✅ Alert acknowledged:', data);
      setAlerts(prevAlerts => 
        prevAlerts.map(alert => 
          alert.id === data.data.id ? data.data : alert
        )
      );
      fetchStats();
      showNotification(`Alert #${data.data.id} acknowledged by ${data.acknowledged_by}`, 'success');
    });

    newSocket.on('emergency_resolved', (data) => {
      console.log('✅ Alert resolved:', data);
      setAlerts(prevAlerts => 
        prevAlerts.map(alert => 
          alert.id === data.data.id ? data.data : alert
        )
      );
      fetchStats();
      showNotification(`Alert #${data.data.id} resolved by ${data.resolved_by}`, 'success');
    });

    setSocket(newSocket);
  };

  const initializeData = async () => {
    setLoading(true);
    await Promise.all([fetchAlerts(), fetchStats()]);
    setLoading(false);
  };

  const fetchAlerts = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/emergency/admin/alerts?limit=100');
      if (response.data.success) {
        setAlerts(response.data.data);
      }
    } catch (error) {
      console.error('❌ Error fetching alerts:', error);
      showNotification('Failed to fetch emergency alerts', 'error');
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/emergency/admin/stats');
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('❌ Error fetching stats:', error);
    }
  };

  const applyFiltersAndSearch = () => {
    let filtered = [...alerts];

    // Apply status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(alert => alert.status === filters.status);
    }

    // Apply user type filter
    if (filters.userType !== 'all') {
      filtered = filtered.filter(alert => alert.user_type === filters.userType);
    }

    // Apply priority filter
    if (filters.priority !== 'all') {
      filtered = filtered.filter(alert => alert.priority_level === filters.priority);
    }

    // Apply date range filter
    if (filters.dateRange !== 'all') {
      const now = new Date();
      const filterDate = new Date();
      
      switch (filters.dateRange) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          filterDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          filterDate.setMonth(now.getMonth() - 1);
          break;
      }
      
      filtered = filtered.filter(alert => new Date(alert.timestamp) >= filterDate);
    }

    // Apply search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(alert =>
        alert.first_name.toLowerCase().includes(term) ||
        alert.last_name.toLowerCase().includes(term) ||
        alert.phone.includes(term) ||
        alert.route_name.toLowerCase().includes(term) ||
        alert.emergency_type.toLowerCase().includes(term) ||
        (alert.registration_number && alert.registration_number.toLowerCase().includes(term)) ||
        (alert.message && alert.message.toLowerCase().includes(term))
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];

      // Handle specific field types
      if (sortConfig.key === 'timestamp' || sortConfig.key === 'acknowledged_at' || sortConfig.key === 'resolved_at') {
        aVal = new Date(aVal || 0);
        bVal = new Date(bVal || 0);
      } else if (sortConfig.key === 'user') {
        aVal = `${a.first_name} ${a.last_name}`.toLowerCase();
        bVal = `${b.first_name} ${b.last_name}`.toLowerCase();
      } else if (sortConfig.key === 'emergency_type') {
        aVal = (a.emergency_type || '').toLowerCase();
        bVal = (b.emergency_type || '').toLowerCase();
      } else if (sortConfig.key === 'priority_level') {
        // Sort by priority importance: critical > high > medium > low
        const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        aVal = priorityOrder[a.priority_level] || 0;
        bVal = priorityOrder[b.priority_level] || 0;
      } else if (sortConfig.key === 'status') {
        // Sort by status: pending > acknowledged > resolved
        const statusOrder = { pending: 3, acknowledged: 2, resolved: 1 };
        aVal = statusOrder[a.status] || 0;
        bVal = statusOrder[b.status] || 0;
      } else if (sortConfig.key === 'route_name') {
        aVal = (a.route_name || '').toLowerCase();
        bVal = (b.route_name || '').toLowerCase();
      } else if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = (bVal || '').toLowerCase();
      }

      if (sortConfig.direction === 'asc') {
        return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
      } else {
        return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
      }
    });

    setFilteredAlerts(filtered);
  };

  const handleSort = (key) => {
    setSortConfig(prevConfig => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  const handleAcknowledge = async (alertId) => {
    setAcknowledging(true);
    try {
      const response = await axios.put(
        `http://localhost:5000/api/emergency/admin/acknowledge/${alertId}`,
        { 
          acknowledged_by: 'Admin Portal User',
          notes: 'Acknowledged via Emergency Manager'
        }
      );

      if (response.data.success) {
        showNotification('Alert acknowledged successfully', 'success');
        setShowDetailModal(false);
      }
    } catch (error) {
      console.error('❌ Error acknowledging alert:', error);
      showNotification('Failed to acknowledge alert', 'error');
    } finally {
      setAcknowledging(false);
    }
  };

  const handleResolve = async (alertId, resolutionNotes = '') => {
    setResolving(true);
    try {
      const response = await axios.put(
        `http://localhost:5000/api/emergency/admin/resolve/${alertId}`,
        { 
          resolved_by: 'Admin Portal User',
          resolution_notes: resolutionNotes || 'Resolved via Emergency Manager'
        }
      );

      if (response.data.success) {
        showNotification('Alert resolved successfully', 'success');
        setShowDetailModal(false);
      }
    } catch (error) {
      console.error('❌ Error resolving alert:', error);
      showNotification('Failed to resolve alert', 'error');
    } finally {
      setResolving(false);
    }
  };

  const showNotification = (message, type) => {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 p-4 rounded-lg z-50 ${
      type === 'success' ? 'bg-green-500' : 'bg-red-500'
    } text-white shadow-lg transition-all duration-300`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.opacity = '0';
      setTimeout(() => {
        if (document.body.contains(notification)) {
          document.body.removeChild(notification);
        }
      }, 300);
    }, 4000);
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'text-red-600 bg-red-100';
      case 'acknowledged': return 'text-yellow-600 bg-yellow-100';
      case 'resolved': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString()
    };
  };

  const exportToCSV = () => {
    const headers = ['ID', 'Date', 'Time', 'User Type', 'Name', 'Registration', 'Phone', 'Route', 'Emergency Type', 'Priority', 'Status', 'Location', 'Message'];
    const csvData = filteredAlerts.map(alert => {
      const { date, time } = formatDateTime(alert.timestamp);
      return [
        alert.id,
        date,
        time,
        alert.user_type,
        `${alert.first_name} ${alert.last_name}`,
        alert.registration_number || 'N/A',
        alert.phone,
        alert.route_name,
        alert.emergency_type,
        alert.priority_level,
        alert.status,
        alert.latitude && alert.longitude ? `${alert.latitude}, ${alert.longitude}` : 'Unknown',
        (alert.message || '').replace(/,/g, ';')
      ];
    });

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `emergency_alerts_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#B3D9FF] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-red-700 text-lg">Loading emergency alerts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#B3D9FF] flex flex-col">
      
      {/* Navigation Bar */}
      <nav className="bg-white p-4 shadow-md flex justify-between items-center">
        <div className="flex items-center">
          <img src="/2.png" alt="Logo" className="w-12 h-12 mr-3" />
          <h1 className="text-2xl font-bold text-red-600">
            🚨 Emergency Alert Management
          </h1>
        </div>
        
        <div className="flex items-center space-x-4">
          <Link 
            to="/dashboard" 
            className="text-blue-700 hover:text-blue-900 font-medium flex items-center"
          >
            <FaHome className="mr-1" />
            Dashboard
          </Link>
          <div className="relative group">
            <FaUserCircle className="text-3xl text-blue-700 cursor-pointer" />
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
              <button
                onClick={handleLogout}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Quick Stats */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Alerts</p>
                <p className="text-2xl font-bold text-gray-800">{stats.total_alerts || 0}</p>
              </div>
              <FaExclamationTriangle className="text-3xl text-gray-600" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-red-600">{stats.pending_alerts || 0}</p>
              </div>
              <FaBell className="text-3xl text-red-600" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Acknowledged</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.acknowledged_alerts || 0}</p>
              </div>
              <FaCheckCircle className="text-3xl text-yellow-600" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Resolved</p>
                <p className="text-2xl font-bold text-green-600">{stats.resolved_alerts || 0}</p>
              </div>
              <FaTimesCircle className="text-3xl text-green-600" />
            </div>
          </div>
        </div>

        {/* Filters and Controls */}
        <div className="bg-white p-4 rounded-lg shadow-lg mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Search */}
            <div className="flex items-center space-x-2">
              <FaSearch className="text-gray-500" />
              <input
                type="text"
                placeholder="Search alerts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 w-64"
              />
            </div>

            {/* Filters */}
            <div className="flex items-center space-x-4">
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="acknowledged">Acknowledged</option>
                <option value="resolved">Resolved</option>
              </select>

              <select
                value={filters.userType}
                onChange={(e) => setFilters(prev => ({ ...prev, userType: e.target.value }))}
                className="border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="all">All Users</option>
                <option value="student">Students</option>
                <option value="captain">Captains</option>
              </select>

              <select
                value={filters.priority}
                onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
                className="border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="all">All Priority</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>

              <select
                value={filters.dateRange}
                onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value }))}
                className="border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
              </select>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-2">
              <button
                onClick={fetchAlerts}
                className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <FaSync className="mr-1" />
                Refresh
              </button>
              <button
                onClick={exportToCSV}
                className="flex items-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <FaDownload className="mr-1" />
                Export CSV
              </button>
            </div>
          </div>
        </div>

        {/* Alerts Table */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-4 border-b">
            <h2 className="text-xl font-bold text-gray-800">
              Emergency Alerts ({filteredAlerts.length})
            </h2>
          </div>

          {filteredAlerts.length === 0 ? (
            <div className="p-8 text-center">
              <FaExclamationTriangle className="text-6xl text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">No emergency alerts found</p>
              <p className="text-gray-500">Try adjusting your filters or search terms</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('id')}>
                      <div className="flex items-center">
                        ID
                        {sortConfig.key === 'id' ? (
                          sortConfig.direction === 'desc' ? <FaSortDown className="ml-1" /> : <FaSortUp className="ml-1" />
                        ) : <FaSort className="ml-1" />}
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('timestamp')}>
                      <div className="flex items-center">
                        Date/Time
                        {sortConfig.key === 'timestamp' ? (
                          sortConfig.direction === 'desc' ? <FaSortDown className="ml-1" /> : <FaSortUp className="ml-1" />
                        ) : <FaSort className="ml-1" />}
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('user')}>
                      <div className="flex items-center">
                        User
                        {sortConfig.key === 'user' ? (
                          sortConfig.direction === 'desc' ? <FaSortDown className="ml-1" /> : <FaSortUp className="ml-1" />
                        ) : <FaSort className="ml-1" />}
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('emergency_type')}>
                      <div className="flex items-center">
                        Emergency Type
                        {sortConfig.key === 'emergency_type' ? (
                          sortConfig.direction === 'desc' ? <FaSortDown className="ml-1" /> : <FaSortUp className="ml-1" />
                        ) : <FaSort className="ml-1" />}
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('priority_level')}>
                      <div className="flex items-center">
                        Priority
                        {sortConfig.key === 'priority_level' ? (
                          sortConfig.direction === 'desc' ? <FaSortDown className="ml-1" /> : <FaSortUp className="ml-1" />
                        ) : <FaSort className="ml-1" />}
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('status')}>
                      <div className="flex items-center">
                        Status
                        {sortConfig.key === 'status' ? (
                          sortConfig.direction === 'desc' ? <FaSortDown className="ml-1" /> : <FaSortUp className="ml-1" />
                        ) : <FaSort className="ml-1" />}
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('route_name')}>
                      <div className="flex items-center">
                        Route
                        {sortConfig.key === 'route_name' ? (
                          sortConfig.direction === 'desc' ? <FaSortDown className="ml-1" /> : <FaSortUp className="ml-1" />
                        ) : <FaSort className="ml-1" />}
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredAlerts.map((alert) => {
                    const { date, time } = formatDateTime(alert.timestamp);
                    return (
                      <tr key={alert.id} className="hover:bg-gray-50">
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          #{alert.id}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div>
                            <div className="font-medium">{date}</div>
                            <div className="text-xs text-gray-400">{time}</div>
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div>
                            <div className="font-medium">{alert.first_name} {alert.last_name}</div>
                            <div className="text-xs text-gray-500 flex items-center">
                              <FaUser className="mr-1" />
                              {alert.user_type.charAt(0).toUpperCase() + alert.user_type.slice(1)}
                              {alert.registration_number && ` • ${alert.registration_number}`}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span className="capitalize font-medium">
                            {alert.emergency_type.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(alert.priority_level)}`}>
                            {alert.priority_level.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(alert.status)}`}>
                            {alert.status.charAt(0).toUpperCase() + alert.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                          {alert.route_name}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => {
                                setSelectedAlert(alert);
                                setShowDetailModal(true);
                              }}
                              className="text-blue-600 hover:text-blue-800"
                              title="View Details"
                            >
                              <FaEye />
                            </button>
                            {alert.status === 'pending' && (
                              <button
                                onClick={() => handleAcknowledge(alert.id)}
                                className="text-yellow-600 hover:text-yellow-800"
                                title="Acknowledge"
                                disabled={acknowledging}
                              >
                                <FaCheckCircle />
                              </button>
                            )}
                            {alert.status !== 'resolved' && (
                              <button
                                onClick={() => handleResolve(alert.id)}
                                className="text-green-600 hover:text-green-800"
                                title="Resolve"
                                disabled={resolving}
                              >
                                <FaTimesCircle />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Alert Detail Modal */}
      {showDetailModal && selectedAlert && (
        <>
          <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={() => setShowDetailModal(false)}></div>
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              
              {/* Modal Header */}
              <div className="bg-red-600 text-white p-6 rounded-t-lg">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold flex items-center">
                    <FaExclamationTriangle className="mr-3" />
                    Emergency Alert #{selectedAlert.id}
                  </h2>
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="text-white hover:text-gray-200"
                  >
                    <FaTimes size={24} />
                  </button>
                </div>
                <div className="mt-2 flex items-center space-x-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getPriorityColor(selectedAlert.priority_level)}`}>
                    {selectedAlert.priority_level.toUpperCase()} PRIORITY
                  </span>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(selectedAlert.status)}`}>
                    {selectedAlert.status.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-6">
                
                {/* User Information */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-bold text-lg mb-3 flex items-center">
                    <FaUser className="mr-2 text-blue-600" />
                    User Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Name</p>
                      <p className="font-medium">{selectedAlert.first_name} {selectedAlert.last_name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">User Type</p>
                      <p className="font-medium capitalize">{selectedAlert.user_type}</p>
                    </div>
                    {selectedAlert.registration_number && (
                      <div>
                        <p className="text-sm text-gray-600">Registration Number</p>
                        <p className="font-medium">{selectedAlert.registration_number}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-sm text-gray-600">Phone</p>
                      <p className="font-medium flex items-center">
                        <FaPhone className="mr-1 text-green-600" />
                        {selectedAlert.phone}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Emergency Details */}
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h3 className="font-bold text-lg mb-3 flex items-center">
                    <FaExclamationTriangle className="mr-2 text-yellow-600" />
                    Emergency Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Emergency Type</p>
                      <p className="font-medium capitalize">{selectedAlert.emergency_type.replace('_', ' ')}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Priority Level</p>
                      <p className="font-medium">{selectedAlert.priority_level.toUpperCase()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Timestamp</p>
                      <p className="font-medium flex items-center">
                        <FaClock className="mr-1 text-blue-600" />
                        {formatDateTime(selectedAlert.timestamp).date} at {formatDateTime(selectedAlert.timestamp).time}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Route</p>
                      <p className="font-medium flex items-center">
                        <FaRoute className="mr-1 text-blue-600" />
                        {selectedAlert.route_name}
                      </p>
                    </div>
                  </div>
                  {selectedAlert.message && (
                    <div className="mt-4">
                      <p className="text-sm text-gray-600">Message</p>
                      <p className="font-medium bg-white p-3 rounded border">{selectedAlert.message}</p>
                    </div>
                  )}
                </div>

                {/* Location Information */}
                {selectedAlert.latitude && selectedAlert.longitude && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="font-bold text-lg mb-3 flex items-center">
                      <FaMapMarkerAlt className="mr-2 text-blue-600" />
                      Location Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Latitude</p>
                        <p className="font-medium">{selectedAlert.latitude}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Longitude</p>
                        <p className="font-medium">{selectedAlert.longitude}</p>
                      </div>
                    </div>
                    <div className="mt-3">
                      <a
                        href={`https://www.google.com/maps?q=${selectedAlert.latitude},${selectedAlert.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        <FaMapMarkerAlt className="mr-2" />
                        View on Google Maps
                      </a>
                    </div>
                  </div>
                )}

                {/* Status Information */}
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-bold text-lg mb-3">Status Information</h3>
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm text-gray-600">Current Status</p>
                      <p className="font-medium capitalize">{selectedAlert.status}</p>
                    </div>
                    {selectedAlert.acknowledged_by && (
                      <div>
                        <p className="text-sm text-gray-600">Acknowledged By</p>
                        <p className="font-medium">{selectedAlert.acknowledged_by}</p>
                      </div>
                    )}
                    {selectedAlert.acknowledged_at && (
                      <div>
                        <p className="text-sm text-gray-600">Acknowledged At</p>
                        <p className="font-medium">{formatDateTime(selectedAlert.acknowledged_at).date} at {formatDateTime(selectedAlert.acknowledged_at).time}</p>
                      </div>
                    )}
                    {selectedAlert.resolution_notes && (
                      <div>
                        <p className="text-sm text-gray-600">Resolution Notes</p>
                        <p className="font-medium bg-white p-3 rounded border">{selectedAlert.resolution_notes}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3 pt-4 border-t">
                  {selectedAlert.status === 'pending' && (
                    <button
                      onClick={() => handleAcknowledge(selectedAlert.id)}
                      disabled={acknowledging}
                      className="flex-1 px-4 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors disabled:opacity-50 flex items-center justify-center"
                    >
                      {acknowledging ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                          Acknowledging...
                        </>
                      ) : (
                        <>
                          <FaCheckCircle className="mr-2" />
                          Acknowledge Alert
                        </>
                      )}
                    </button>
                  )}
                  {selectedAlert.status !== 'resolved' && (
                    <button
                      onClick={() => handleResolve(selectedAlert.id)}
                      disabled={resolving}
                      className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center"
                    >
                      {resolving ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                          Resolving...
                        </>
                      ) : (
                        <>
                          <FaTimesCircle className="mr-2" />
                          Resolve Alert
                        </>
                      )}
                    </button>
                  )}
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="px-4 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default EmergencyManager;
