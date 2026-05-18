import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, ArrowLeft, Bell } from 'lucide-react';
import api from '../utils/api';
import { formatDateToDDMMYYYY } from '../utils/dateUtils';

const NotificationsPage = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/notifications')
      .then(res => {
        setNotifications(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load notifications", err);
        setLoading(false);
      });
  }, []);

  const markAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
    } catch (error) {
      console.error("Failed to mark notification as read", error);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen pb-20">
      <div className="bg-white shadow flex flex-col justify-end pt-8 px-4 pb-4">
        <div className="flex items-center space-x-3">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full transition">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center">
            Notifications 
            <span className="ml-2 bg-saffron-100 text-saffron-700 text-xs px-2.5 py-0.5 rounded-full font-bold">
              {notifications.filter(n => !n.isRead).length} New
            </span>
          </h1>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {loading ? (
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white p-4 rounded-2xl h-24 shadow-sm border border-gray-100" />
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center pt-24 text-gray-400">
            <Bell className="w-16 h-16 text-gray-200 mb-4" />
            <p className="text-lg font-medium text-gray-500">No new notifications</p>
            <p className="text-sm">You're all caught up!</p>
          </div>
        ) : (
          notifications.map(n => (
            <div key={n._id} className={`bg-white p-5 rounded-2xl shadow-sm border ${!n.isRead ? 'border-saffron-200 bg-orange-50/30' : 'border-gray-100'}`}>
              <div className="flex justify-between items-start mb-2">
                <h3 className={`font-bold text-gray-900 ${!n.isRead ? 'text-lg' : 'text-md text-gray-700'}`}>{n.title}</h3>
                {!n.isRead && (
                  <button onClick={() => markAsRead(n._id)} className="bg-saffron-100 text-saffron-600 p-2 rounded-full hover:bg-saffron-200 transition shrink-0 ml-3 shadow-sm">
                    <CheckCircle2 className="w-5 h-5" />
                  </button>
                )}
              </div>
              <p className="text-gray-600 leading-relaxed text-sm mb-3">{n.message}</p>
              <div className="flex items-center text-xs font-semibold text-gray-400">
                <span>{n.date ? formatDateToDDMMYYYY(n.date) : formatDateToDDMMYYYY(n.createdAt)}</span>
                <span className="mx-2">•</span>
                <span>{n.time ? n.time : new Date(n.createdAt).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
