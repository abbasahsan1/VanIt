import React, { useState, useEffect } from 'react';
import { FaHistory, FaBus, FaClock, FaCalendarAlt, FaRoute, FaUser } from 'react-icons/fa';
import axios from 'axios';

const AttendanceHistory = ({ studentId }) => {
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    limit: 20
  });

  useEffect(() => {
    fetchAttendanceHistory();
  }, [studentId, filters]);

  const fetchAttendanceHistory = async () => {
    if (!studentId) return;

    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.append('dateTo', filters.dateTo);
      if (filters.limit) params.append('limit', filters.limit);

      const response = await axios.get(
        `http://localhost:5000/api/attendance/student/${studentId}/history?${params}`
      );

      if (response.data.success) {
        setAttendanceHistory(response.data.data);
      } else {
        setError('Failed to fetch attendance history');
      }
    } catch (err) {
      console.error('Error fetching attendance history:', err);
      setError('Failed to load attendance history');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString()
    };
  };

  const getStatusColor = (isValid) => {
    return isValid ? 'text-green-600' : 'text-red-600';
  };

  const getStatusText = (isValid) => {
    return isValid ? 'Valid' : 'Invalid';
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mr-3"></div>
          <span className="text-gray-600">Loading attendance history...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="bg-blue-500 text-white p-4 rounded-t-lg">
        <h2 className="text-xl font-bold flex items-center">
          <FaHistory className="mr-2" />
          Attendance History
        </h2>
      </div>

      {/* Filters */}
      <div className="p-4 border-b bg-gray-50">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              From Date
            </label>
            <input
              type="date"
              name="dateFrom"
              value={filters.dateFrom}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              To Date
            </label>
            <input
              type="date"
              name="dateTo"
              value={filters.dateTo}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Limit
            </label>
            <select
              name="limit"
              value={filters.limit}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={10}>10 records</option>
              <option value={20}>20 records</option>
              <option value={50}>50 records</option>
              <option value={100}>100 records</option>
            </select>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {error ? (
          <div className="text-center py-8">
            <FaHistory className="text-4xl text-gray-400 mx-auto mb-2" />
            <p className="text-red-600">{error}</p>
            <button
              onClick={fetchAttendanceHistory}
              className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : attendanceHistory.length === 0 ? (
          <div className="text-center py-8">
            <FaHistory className="text-4xl text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600">No attendance records found</p>
            <p className="text-sm text-gray-500 mt-1">
              Start scanning QR codes to build your attendance history
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {attendanceHistory.map((record, index) => {
              const dateTime = formatDateTime(record.scan_timestamp);
              
              return (
                <div
                  key={record.id || index}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      <div className="bg-blue-100 p-2 rounded-full mr-3">
                        <FaBus className="text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-800">
                          {record.route_name}
                        </h3>
                        <p className="text-sm text-gray-600">
                          Captain: {record.captain_first_name} {record.captain_last_name}
                        </p>
                      </div>
                    </div>
                    <div className={`text-sm font-medium ${getStatusColor(record.is_valid)}`}>
                      {getStatusText(record.is_valid)}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="flex items-center text-gray-600">
                      <FaCalendarAlt className="mr-2 text-gray-400" />
                      <span>{dateTime.date}</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <FaClock className="mr-2 text-gray-400" />
                      <span>{dateTime.time}</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <FaRoute className="mr-2 text-gray-400" />
                      <span>{record.scan_type || 'Boarding'}</span>
                    </div>
                    {record.session_id && (
                      <div className="flex items-center text-gray-600">
                        <FaUser className="mr-2 text-gray-400" />
                        <span>Session: {record.session_id.substring(0, 8)}...</span>
                      </div>
                    )}
                  </div>

                  {record.location_lat && record.location_lng && (
                    <div className="mt-2 text-xs text-gray-500">
                      Location: {parseFloat(record.location_lat).toFixed(4)}, {parseFloat(record.location_lng).toFixed(4)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Summary */}
      {attendanceHistory.length > 0 && (
        <div className="border-t bg-gray-50 p-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">
              Total Records: {attendanceHistory.length}
            </span>
            <span className="text-sm text-gray-600">
              Valid Scans: {attendanceHistory.filter(record => record.is_valid).length}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceHistory;
