import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  User, Mail, Shield, Save, Eye, EyeOff, MapPin, 
  LogOut, AlertTriangle, Calendar, Phone, 
  Droplet, Briefcase, Award, ChevronDown, ChevronUp,
  CheckCircle, XCircle, HeartPulse, ShieldAlert, Camera
} from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { formatDateToDDMMYYYY } from '../utils/dateUtils';

const Profile = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  
  // Data State
  const [profile, setProfile] = useState({ name: '', email: '', role: '', profilePhoto: null });
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // UI State
  const [updating, setUpdating] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // Form State
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [profileRes, attendanceRes] = await Promise.all([
        api.get('/users/me'),
        api.get('/attendance/my-attendance')
      ]);
      setProfile(profileRes.data);
      setName(profileRes.data.name || '');
      setProfilePhoto(profileRes.data.profilePhoto || null);
      setAttendance(Array.isArray(attendanceRes.data) ? attendanceRes.data : []);
    } catch (error) {
      toast.error('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 400;
        const MAX_HEIGHT = 400;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        setProfilePhoto(dataUrl);
        savePhotoToBackend(dataUrl);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const savePhotoToBackend = async (photoUrl) => {
    try {
      const res = await api.put('/users/update', { 
        name: profile.name, // need to send existing name as it's required by the backend logic
        profilePhoto: photoUrl 
      });
      setProfile(res.data);
      toast.success('Profile photo updated');
    } catch (error) {
      toast.error('Failed to save profile photo');
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setUpdating(true);
    try {
      const updateData = { name };
      if (password) updateData.password = password;
      if (profilePhoto !== profile.profilePhoto) updateData.profilePhoto = profilePhoto;
      
      const res = await api.put('/users/update', updateData);
      setProfile(res.data);
      setPassword(''); // clear password field after successful update
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setUpdating(false);
    }
  };

  const executeLogout = () => {
    localStorage.removeItem('userToken');
    localStorage.removeItem('adminToken');
    navigate('/signup');
  };

  // Attendance Calculations
  const totalMeetings = attendance.length;
  const presentCount = attendance.filter(a => a.status === 'present').length;
  const absentCount = totalMeetings - presentCount;
  const attendancePercentage = totalMeetings > 0 ? Math.round((presentCount / totalMeetings) * 100) : 0;

  if (loading) {
    return <div className="text-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#e65c00] mx-auto"></div></div>;
  }

  // Get Badge Color based on Role
  const getRoleBadge = (role) => {
    switch(role) {
      case 'admin': return 'bg-indigo-100 text-indigo-700';
      case 'karyavah': return 'bg-purple-100 text-purple-700';
      case 'mukhya_shikshak': return 'bg-[#ffefe3] text-[#e65c00]';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const displayRole = profile.role === 'admin' ? 'Administrator' : 
                      profile.role === 'karyavah' ? 'Karyavah' : 
                      profile.role === 'mukhya_shikshak' ? 'Mukhya Shikshak' : 'Member';

  return (
    <div className="bg-[#fcfbf9] min-h-screen pt-6 pb-28 font-sans">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 space-y-6">
        
        {/* 1. Profile Header Section */}
        <div className="bg-white rounded-[32px] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-gray-100 flex flex-col md:flex-row items-center md:items-start text-center md:text-left gap-6 relative overflow-hidden">
           <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-[#ffefe3] to-transparent rounded-full -mr-20 -mt-20 pointer-events-none opacity-60"></div>
           
           <div className="relative shrink-0 z-10">
             <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-[#e65c00] to-[#ffb380] text-white flex items-center justify-center text-4xl font-black shadow-lg">
                {profilePhoto ? (
                  <img src={profilePhoto} alt="Profile" className="w-full h-full object-cover rounded-full" />
                ) : (
                  (profile?.name || 'U').charAt(0).toUpperCase()
                )}
             </div>
             
             <button 
                type="button"
                onClick={handlePhotoClick}
                className="absolute bottom-0 right-0 bg-white p-2.5 rounded-full shadow-[0_2px_10px_rgba(0,0,0,0.15)] border border-gray-100 text-[#e65c00] hover:bg-gray-50 active:scale-95 transition-all"
             >
                <Camera className="w-4 h-4" />
             </button>

             <input 
               type="file" 
               ref={fileInputRef} 
               onChange={handlePhotoChange} 
               accept="image/*" 
               className="hidden" 
             />
           </div>
           
           <div className="flex-1 relative z-10">
             <div className="flex flex-col md:flex-row md:items-center gap-3 mb-2 justify-center md:justify-start">
               <h1 className="text-3xl font-black text-gray-900 tracking-tight">{profile?.name || 'Unknown User'}</h1>
               <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider inline-block ${getRoleBadge(profile.role)}`}>
                 {displayRole}
               </span>
             </div>
             
             <div className="space-y-1.5 text-[15px] text-gray-600 font-medium">
                {profile.shakha?.name && (
                   <div className="flex items-center justify-center md:justify-start">
                     <MapPin className="w-4 h-4 text-[#e65c00] mr-2" />
                     Shakha: <span className="font-bold text-gray-900 ml-1">{profile.shakha.name}</span>
                   </div>
                )}
                {profile.nagar && (
                   <div className="flex items-center justify-center md:justify-start">
                     <MapPin className="w-4 h-4 text-[#e65c00] mr-2" />
                     Nagar: <span className="font-bold text-gray-900 ml-1">{profile.nagar}</span>
                   </div>
                )}
                {profile.createdAt && (
                   <div className="flex items-center justify-center md:justify-start">
                     <Calendar className="w-4 h-4 text-[#e65c00] mr-2" />
                     Joined: <span className="text-gray-900 ml-1">{formatDateToDDMMYYYY(profile.createdAt)}</span>
                   </div>
                )}
             </div>
           </div>
        </div>

        {/* 2. Attendance Summary Section */}
        {profile.role !== 'admin' && (
          <div className="bg-white rounded-[28px] p-6 sm:p-8 shadow-[0_4px_20px_rgb(0,0,0,0.04)] border border-gray-100">
             <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
               <CheckCircle className="w-5 h-5 text-[#e65c00] mr-2" />
               Attendance Analytics
             </h3>
             
             <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-50 rounded-2xl p-4 text-center border border-gray-100">
                   <p className="text-3xl font-black text-gray-900 mb-1">{totalMeetings}</p>
                   <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Total Meetings</p>
                </div>
                <div className="bg-green-50 rounded-2xl p-4 text-center border border-green-100">
                   <p className="text-3xl font-black text-green-600 mb-1">{presentCount}</p>
                   <p className="text-[11px] font-bold text-green-600/70 uppercase tracking-wider">Present</p>
                </div>
                <div className="bg-red-50 rounded-2xl p-4 text-center border border-red-100">
                   <p className="text-3xl font-black text-red-500 mb-1">{absentCount}</p>
                   <p className="text-[11px] font-bold text-red-500/70 uppercase tracking-wider">Absent</p>
                </div>
                <div className="bg-[#ffefe3] rounded-2xl p-4 text-center border border-[#ffefe3]">
                   <p className="text-3xl font-black text-[#e65c00] mb-1">{attendancePercentage}%</p>
                   <p className="text-[11px] font-bold text-[#e65c00]/70 uppercase tracking-wider">Overall</p>
                </div>
             </div>
          </div>
        )}

        {/* 3. Membership Information (Read Only) */}
        <div className="bg-white rounded-[28px] p-6 sm:p-8 shadow-[0_4px_20px_rgb(0,0,0,0.04)] border border-gray-100">
           <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
             <Shield className="w-5 h-5 text-[#e65c00] mr-2" />
             Membership Identity
           </h3>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                 <p className="text-[12px] font-bold text-gray-400 uppercase tracking-wider mb-1">Email / Phone</p>
                 <div className="flex items-center text-gray-900 font-bold">
                   <Mail className="w-4 h-4 text-[#e65c00] mr-2" />
                   {profile.email || profile.phone || 'N/A'}
                 </div>
              </div>
              <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                 <p className="text-[12px] font-bold text-gray-400 uppercase tracking-wider mb-1">Member Status</p>
                 <div className="flex items-center text-gray-900 font-bold">
                   <Award className="w-4 h-4 text-[#e65c00] mr-2" />
                   {profile.hasJoinRequest ? 'Join Request Pending' : 'Active Member'}
                 </div>
              </div>
           </div>
        </div>

        {/* 4. Advanced Fields (Expandable) */}
        <div className="bg-white rounded-[28px] shadow-[0_4px_20px_rgb(0,0,0,0.04)] border border-gray-100 overflow-hidden">
           <button 
             onClick={() => setShowAdvanced(!showAdvanced)}
             className="w-full flex items-center justify-between p-6 sm:p-8 hover:bg-gray-50 transition-colors"
           >
              <h3 className="text-lg font-bold text-gray-900 flex items-center">
                <HeartPulse className="w-5 h-5 text-[#e65c00] mr-2" />
                Advanced Details (Optional)
              </h3>
              {showAdvanced ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
           </button>
           
           {showAdvanced && (
              <div className="px-6 sm:px-8 pb-8 pt-2 grid grid-cols-1 md:grid-cols-2 gap-5 animate-in fade-in slide-in-from-top-4 duration-300">
                 <div className="opacity-60 pointer-events-none">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Blood Group</label>
                    <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
                       <Droplet className="w-4 h-4 text-gray-400 mr-2" />
                       <span className="text-gray-500 text-sm font-medium">Not specified</span>
                    </div>
                 </div>
                 <div className="opacity-60 pointer-events-none">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Profession</label>
                    <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
                       <Briefcase className="w-4 h-4 text-gray-400 mr-2" />
                       <span className="text-gray-500 text-sm font-medium">Not specified</span>
                    </div>
                 </div>
                 <div className="opacity-60 pointer-events-none">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Emergency Contact</label>
                    <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
                       <ShieldAlert className="w-4 h-4 text-gray-400 mr-2" />
                       <span className="text-gray-500 text-sm font-medium">Not specified</span>
                    </div>
                 </div>
                 <div className="opacity-60 pointer-events-none">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Skills / Interests</label>
                    <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
                       <Award className="w-4 h-4 text-gray-400 mr-2" />
                       <span className="text-gray-500 text-sm font-medium">Not specified</span>
                    </div>
                 </div>
              </div>
           )}
        </div>

        {/* 5. Account Settings (Editable) */}
        <div className="bg-white rounded-[28px] p-6 sm:p-8 shadow-[0_4px_20px_rgb(0,0,0,0.04)] border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
            <User className="w-5 h-5 text-[#e65c00] mr-2" />
            Account Settings
          </h3>
          
          <form onSubmit={handleUpdate} className="space-y-6">
            <div>
              <label className="block text-[13px] font-bold text-gray-700 mb-1.5 ml-1">Full Name</label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#e65c00] focus:border-transparent font-medium bg-gray-50 focus:bg-white transition-colors"
              />
            </div>

            <div>
              <label className="block text-[13px] font-bold text-gray-700 mb-1.5 ml-1">Change Password</label>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"} 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#e65c00] focus:border-transparent font-medium pr-12 bg-gray-50 focus:bg-white transition-colors"
                  placeholder="Leave blank to keep current password"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-[#e65c00] transition-colors">
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button 
                type="submit" 
                disabled={updating}
                className="w-full sm:w-auto bg-[#e65c00] hover:bg-[#cc5200] text-white px-8 py-3.5 rounded-2xl font-bold shadow-[0_4px_15px_rgba(230,92,0,0.3)] active:scale-95 transition-all flex items-center justify-center disabled:opacity-50"
              >
                <Save className="w-5 h-5 mr-2" />
                {updating ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </form>
        </div>

        {/* 6. Logout Section */}
        <div className="flex justify-center pt-4">
           <button 
              type="button" 
              onClick={() => setShowLogoutModal(true)}
              className="w-full sm:w-auto bg-white text-red-500 border border-red-100 hover:bg-red-50 px-8 py-3.5 rounded-2xl font-bold shadow-sm active:scale-95 transition-all flex items-center justify-center"
           >
             <LogOut className="w-5 h-5 mr-2" />
             Logout Securely
           </button>
        </div>

        {/* Logout Confirmation Modal Overlay */}
        {showLogoutModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-[32px] p-6 md:p-8 max-w-sm w-full shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200 object-center">
               <div className="absolute top-0 right-0 w-32 h-32 bg-red-50 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
               
               <div className="w-16 h-16 bg-red-50 rounded-[20px] flex justify-center items-center mb-5 border border-red-100">
                 <AlertTriangle className="w-8 h-8 text-red-500" />
               </div>
               
               <h3 className="text-2xl font-bold text-gray-900 mb-2 tracking-tight">Logout?</h3>
               <p className="text-gray-500 mb-8 leading-relaxed text-sm">
                 Are you sure you want to securely logout? Your session will be cleared from this device.
               </p>
               
               <div className="grid grid-cols-2 gap-3 w-full">
                 <button 
                   onClick={() => setShowLogoutModal(false)}
                   className="w-full bg-gray-50 text-gray-700 font-bold py-3.5 rounded-2xl border border-gray-100 active:scale-95 transition-transform"
                 >
                   Cancel
                 </button>
                 <button 
                   onClick={executeLogout}
                   className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3.5 rounded-2xl shadow-[0_4px_15px_rgba(239,68,68,0.3)] active:scale-95 transition-all flex justify-center items-center"
                 >
                   Yes, Logout
                 </button>
               </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default Profile;
