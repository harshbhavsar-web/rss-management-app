import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Mail, User, Save, LogOut, Key } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../utils/api';

const AdminProfile = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  
  // Form State
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/admin/profile');
      setProfile(res.data);
      setName(res.data.name || '');
    } catch (error) {
       if (error.response?.status === 401) {
          localStorage.removeItem('adminToken');
          navigate('/admin/login');
       } else {
          toast.error('Failed to load profile');
       }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setUpdating(true);
    try {
      const updateData = { name };
      if (password) updateData.password = password;
      
      const res = await api.put('/admin/profile', updateData);
      setProfile(res.data);
      setPassword(''); // clear password field after successful update
      toast.success('Admin profile updated successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setUpdating(false);
    }
  };

  const executeLogout = () => {
    if (window.confirm("Are you sure you want to securely logout from the admin panel?")) {
      localStorage.removeItem('adminToken');
      navigate('/admin/login');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20 text-gray-500">
        Loading Admin Profile...
      </div>
    );
  }

  if (!profile) return null;

  const inputClass = "w-full border border-gray-300 bg-white focus:ring-2 focus:ring-orange-500 rounded-lg px-4 py-2.5 text-sm transition-colors shadow-sm text-gray-800";

  return (
    <div className="max-w-3xl mx-auto py-10 px-4">
      <div className="flex items-center space-x-3 mb-8 pb-4 border-b border-gray-200">
         <Shield className="w-8 h-8 text-orange-500" />
         <h1 className="text-2xl font-bold text-gray-900">Admin Workspace Profile</h1>
      </div>

      <div className="bg-white shadow-sm border border-gray-200 rounded-2xl overflow-hidden p-6 md:p-8">
         <form onSubmit={handleUpdate} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
               <div>
                 <label className="block text-sm font-semibold text-gray-600 mb-1.5 flex items-center">
                    <User className="w-4 h-4 mr-1.5" /> Full Name
                 </label>
                 <input 
                   type="text" 
                   value={name}
                   onChange={(e) => setName(e.target.value)}
                   required
                   className={inputClass}
                 />
               </div>

               <div>
                 <label className="block text-sm font-semibold text-gray-600 mb-1.5 flex items-center">
                    <Mail className="w-4 h-4 mr-1.5" /> Registered Email
                 </label>
                 <input 
                   type="text" 
                   value={profile.email || 'N/A'}
                   disabled
                   className="w-full border border-gray-200 bg-gray-100 rounded-lg px-4 py-2.5 text-sm shadow-inner text-gray-500 cursor-not-allowed"
                 />
               </div>

               <div>
                 <label className="block text-sm font-semibold text-gray-600 mb-1.5 flex items-center">
                    <Shield className="w-4 h-4 mr-1.5" /> Workspace Role
                 </label>
                 <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-bold bg-orange-50 text-orange-700 border border-orange-100 uppercase tracking-widest">
                   {profile.role || 'Admin'}
                 </span>
               </div>

               <div>
                 <label className="block text-sm font-semibold text-gray-600 mb-1.5 flex items-center">
                    <Key className="w-4 h-4 mr-1.5" /> Change Password (Optional)
                 </label>
                 <input 
                   type="password" 
                   value={password}
                   onChange={(e) => setPassword(e.target.value)}
                   className={inputClass}
                   placeholder="Leave blank to keep same"
                 />
               </div>
            </div>

            <div className="pt-6 border-t border-gray-50 flex flex-col sm:flex-row justify-between items-center gap-4">
              <button 
                type="button"
                onClick={executeLogout}
                className="w-full sm:w-auto flex justify-center items-center px-6 py-2.5 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 font-bold rounded-xl transition-colors border border-red-100"
              >
                <LogOut className="w-4 h-4 mr-2" /> Logout Admin
              </button>
              
              <button 
                type="submit"
                disabled={updating}
                className="w-full sm:w-auto flex justify-center items-center px-8 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl transition-colors shadow-sm disabled:opacity-50"
              >
                <Save className="w-4 h-4 mr-2" /> 
                {updating ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
         </form>
      </div>
    </div>
  );
};

export default AdminProfile;
