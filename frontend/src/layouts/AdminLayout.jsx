import { Outlet, useNavigate } from 'react-router-dom';
import { Bell, User as UserIcon, LogOut } from 'lucide-react';

const AdminLayout = () => {
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem('adminToken');
    navigate('/admin/login');
  };

  return (
    <div className="admin-layout flex flex-col font-sans w-full h-full min-h-screen bg-gray-50">
      
      <header className="sticky top-0 z-40 bg-gradient-to-r from-orange-500 to-saffron-600 shadow-md">
          <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center">
               <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">Sardar Nagar RSS</h1>
            </div>
            <div className="flex items-center space-x-4">
               <button aria-label="Notifications" onClick={() => navigate('/admin/notifications')} className="text-white bg-white/20 p-2 rounded-full hover:bg-white/30 transition shadow-sm">
                  <Bell className="w-5 h-5" />
               </button>
               <div className="relative group cursor-pointer z-50">
                  <div onClick={() => navigate('/admin/profile')} className="flex items-center justify-center w-9 h-9 bg-white rounded-full shadow-sm text-saffron-600">
                    <UserIcon className="w-5 h-5" />
                  </div>
                  <div className="absolute right-0 mt-2 w-36 bg-white rounded-xl shadow-lg border border-gray-100 opacity-0 group-hover:opacity-100 invisible group-hover:visible transition-all duration-200">
                     <button onClick={(e) => { e.stopPropagation(); navigate('/admin/profile'); }} className="w-full text-left px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:rounded-t-xl flex items-center transition">
                       <UserIcon className="w-4 h-4 mr-2" /> Profile
                     </button>
                     <button onClick={(e) => { e.stopPropagation(); logout(); }} className="w-full text-left px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 hover:rounded-b-xl flex items-center transition">
                       <LogOut className="w-4 h-4 mr-2" /> Logout
                     </button>
                  </div>
               </div>
            </div>
          </div>
        </header>

      {/* Main Routed Content */}
      <div className="flex-1">
        <Outlet />
      </div>

    </div>
  );
};

export default AdminLayout;
