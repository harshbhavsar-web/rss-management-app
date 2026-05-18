import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { User as UserIcon, Bell } from 'lucide-react';
import { useState, useEffect } from 'react';
import api from '../utils/api';

const Navbar = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [notifications, setNotifications] = useState([]);
  
  const token = localStorage.getItem('userToken') || localStorage.getItem('adminToken');
  const isHome = location.pathname === '/home' || location.pathname === '/';

  useEffect(() => {
    if (token) {
      api.get('/notifications')
        .then(res => setNotifications(res.data))
        .catch(err => console.error("Failed to load notifications", err));
    }
  }, [token]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${isHome ? 'bg-[#e65c00] text-white border-none' : 'bg-[#faf8f5] shadow-[0_2px_15px_rgba(0,0,0,0.03)] border-b border-gray-100/50 text-gray-800'}`}>
      <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-[72px]">
          {/* Left Title */}
          <div className="flex items-center">
            <Link to="/" className={`font-extrabold text-[19px] tracking-tight hover:opacity-90 transition-opacity ${isHome ? 'text-white' : 'text-[#e65c00]'}`}>
              Sardar Nagar RSS
            </Link>
          </div>
          
          {/* Right Icons: Notifications & Profile */}
          <div className="flex items-center space-x-3">
             {token && (
              <button 
                onClick={() => navigate('/notifications')} 
                className={`relative flex items-center justify-center w-[40px] h-[40px] rounded-full focus:outline-none transition-all active:scale-95 border ${isHome ? 'bg-white/10 hover:bg-white/20 border-white/20' : 'bg-white border-gray-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:bg-gray-50'}`}
              >
                <Bell className={`h-[18px] w-[18px] ${isHome ? 'text-white' : 'text-[#e65c00]'}`} />
                {unreadCount > 0 && (
                  <span className={`absolute top-[8px] right-[10px] block h-2 w-2 rounded-full ring-1 ${isHome ? 'border-white/20 ring-white/20' : 'border border-white ring-red-500'} bg-red-500`}></span>
                )}
              </button>
            )}
            <Link 
              to="/profile" 
              className={`flex items-center justify-center w-[40px] h-[40px] rounded-full transition-all active:scale-95 border ${isHome ? 'bg-white/10 hover:bg-white/20 border-white/20' : 'bg-white border-gray-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:bg-gray-50'}`}
            >
               <UserIcon className={`h-[18px] w-[18px] ${isHome ? 'text-white' : 'text-[#e65c00]'}`} />
            </Link>
          </div>
          
        </div>
      </div>
    </nav>
  );
};
export default Navbar;
