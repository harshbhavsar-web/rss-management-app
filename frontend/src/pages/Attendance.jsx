import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useTranslation } from 'react-i18next';
import { Calendar, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { formatDateToDDMMYYYY } from '../utils/dateUtils';

const Attendance = () => {
  const { t } = useTranslation();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAttendance();
  }, []);

  const fetchAttendance = async () => {
    try {
      const { data } = await api.get('/attendance/my-attendance');
      setHistory(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load attendance history:', error);
      toast.error('Failed to load attendance history');
      setHistory([]);
    } finally {
      setLoading(false);
    }
  };

  const safeHistory = Array.isArray(history) ? history : [];
  const total = safeHistory.length;
  const present = safeHistory.filter(h => h.status === 'present').length;
  const absent = total - present;
  const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-saffron-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-4 space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 px-1">My Attendance</h2>
      
      {/* Summary Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-gray-500 font-medium">Overall Attendance</h3>
          <span className={`text-2xl font-bold ${percentage >= 75 ? 'text-green-600' : 'text-saffron-600'}`}>
            {percentage}%
          </span>
        </div>
        
        <div className="grid grid-cols-3 gap-4 text-center divide-x divide-gray-100">
          <div>
            <p className="text-xl font-bold text-gray-900">{total}</p>
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mt-1">Total</p>
          </div>
          <div>
            <p className="text-xl font-bold text-green-600">{present}</p>
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mt-1">Present</p>
          </div>
          <div>
            <p className="text-xl font-bold text-red-500">{absent}</p>
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mt-1">Absent</p>
          </div>
        </div>
      </div>

      {/* History List */}
      <div>
        <h3 className="text-lg font-bold text-gray-800 mb-3 px-1">Meeting History</h3>
        {safeHistory.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-2xl border border-gray-100 shadow-sm">
            <p className="text-gray-500">No attendance records available</p>
          </div>
        ) : (
          <div className="space-y-3">
            {safeHistory.map(record => (
              <div key={record.meetingId} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
                <div className="flex items-start space-x-3">
                  <div className="p-2 bg-saffron-50 rounded-xl text-saffron-600 shrink-0 mt-0.5">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm">{record.meetingTitle}</h4>
                    <p className="text-xs text-gray-500 mt-0.5 font-medium">{formatDateToDDMMYYYY(record.date)} • {record.time}</p>
                  </div>
                </div>
                <div className="shrink-0 ml-3">
                  {record.status === 'present' ? (
                    <div className="flex items-center space-x-1 bg-green-50 text-green-700 px-2.5 py-1 rounded-lg">
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-xs font-bold uppercase tracking-wide">Present</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-1 bg-red-50 text-red-600 px-2.5 py-1 rounded-lg">
                      <XCircle className="w-4 h-4" />
                      <span className="text-xs font-bold uppercase tracking-wide">Absent</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Attendance;
