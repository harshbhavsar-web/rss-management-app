import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  LogOut, Users, MapPin, Calendar, CheckSquare, Plus, Edit2, 
  Trash2, X, Bell, User as UserIcon, Activity, ClipboardCheck, Search, CheckCircle, XCircle
} from 'lucide-react';
import api from '../../utils/api';
import { toast } from 'sonner';
import { formatDateToDDMMYYYY } from '../../utils/dateUtils';

/**
 * Premium Admin Dashboard 
 * Mobile-First Card Layout Component
 */
const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Parse initial tab from URL or default to 'shakhas'
  const getTabFromUrl = () => {
    const pathParts = location.pathname.split('/');
    const tabFromPath = pathParts[pathParts.length - 1];
    const validTabs = ['shakhas', 'meetings', 'events', 'users', 'notifications', 'joinRequests', 'groups'];
    return validTabs.includes(tabFromPath) ? tabFromPath : 'shakhas';
  };

  // State
  const [activeTab, setActiveTab] = useState(getTabFromUrl());
  const [subTab, setSubTab] = useState('upcoming'); // 'upcoming', 'history'
  
  const isExpired = (item) => {
    if (!item.date) return false;
    const timeStr = item.time || '23:59';
    try {
      const scheduledDateTime = new Date(`${item.date}T${timeStr}`);
      const currentDateTime = new Date();
      return currentDateTime.getTime() > scheduledDateTime.getTime();
    } catch (e) {
      return false;
    }
  };  
  // Sync state if URL changes directly
  useEffect(() => {
    setActiveTab(getTabFromUrl());
  }, [location.pathname]);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setSubTab('upcoming'); // Reset subTab when switching main tabs
    navigate(`/admin/${tabId}`, { replace: true });
  };
  const [data, setData] = useState({ shakhas: [], meetings: [], events: [], joinRequests: [], users: [], notifications: [], groups: [] });
  const [loading, setLoading] = useState(true);
  const [usersError, setUsersError] = useState(false);
  const [selectedShakhaFilter, setSelectedShakhaFilter] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState('shakha'); // 'shakha', 'meeting', 'event', 'notification'
  const [modalMode, setModalMode] = useState('add'); // 'add', 'edit'
  const [currentItemId, setCurrentItemId] = useState(null);
  const [formData, setFormData] = useState({});
  const [attendanceData, setAttendanceData] = useState([]);
  const [attendanceSearch, setAttendanceSearch] = useState('');

  // Auth & Fetch Data
  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin/login');
      return;
    }
    fetchData();
  }, [navigate]);

  const fetchData = async (showLoader = true) => {
    if (showLoader) setLoading(true);
    try {
      const results = await Promise.allSettled([
        api.get('/shakhas'),
        api.get('/meetings'),
        api.get('/events'),
        api.get('/join'),
        api.get('/users'),
        api.get('/notifications'),
        api.get('/groups')
      ]);

      const getVal = (res, name) => {
        if (res.status === 'fulfilled') return res.value.data;
        console.error(`❌ Failed to load ${name}:`, res.reason?.response?.data || res.reason?.message || res.reason);
        return null;
      };
      
      setUsersError(results[4].status === 'rejected');

      setData({
        shakhas: getVal(results[0], 'shakhas') || [],
        meetings: getVal(results[1], 'meetings') || [],
        events: getVal(results[2], 'events') || [],
        joinRequests: getVal(results[3], 'join requests') || [],
        users: getVal(results[4], 'users'), 
        notifications: getVal(results[5], 'notifications') || [],
        groups: getVal(results[6], 'groups') || [],
      });

    } catch (error) {
       console.error("Dashboard fetch strictly failed:", error);
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('adminToken');
    navigate('/admin/login');
  };

  // CRUD Operations
  const deleteItem = async (type, id) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    try {
      await api.delete(`/${type}/${id}`);
      toast.success('Deleted successfully');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete item');
    }
  };

  const openModal = (type, mode, item = null) => {
    setModalType(type);
    setModalMode(mode);
    setCurrentItemId(item ? item._id : null);
    
    if (mode === 'edit' && item) {
      const mappedData = { ...item };
      
      // For Group edits, map users to their IDs
      if (type === 'group' && mappedData.users && Array.isArray(mappedData.users)) {
        mappedData.users = mappedData.users.map(u => typeof u === 'object' ? u._id : u);
      }

      if (mappedData.shakhas && Array.isArray(mappedData.shakhas)) {
        mappedData.shakhas = mappedData.shakhas.map(s => typeof s === 'object' ? s._id : s);
      } else {
        mappedData.shakhas = [];
      }
      setFormData(mappedData);
    } else {
      setFormData({});
    }
    
    if (type === 'attendance') {
      try {
        api.get(`/attendance/${item._id}`).then(res => {
          setAttendanceData(res.data.records || []);
        });
      } catch (err) {
        toast.error('Failed to load attendance');
      }
    }
    
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormData({});
    setAttendanceData([]);
    setAttendanceSearch('');
    setCurrentItemId(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent] || {}),
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let endpoint = '';
      if (modalType === 'shakha') endpoint = '/shakhas';
      if (modalType === 'meeting') endpoint = '/meetings';
      if (modalType === 'event') endpoint = '/events';
      if (modalType === 'notification') endpoint = '/notifications';
      if (modalType === 'group') endpoint = '/groups';
      if (modalType === 'user') endpoint = '/users';

      let submitData = { ...formData };
      if (modalType === 'notification') {
        submitData.type = (submitData.shakhas && submitData.shakhas.length === data.shakhas.length) ? 'nagar-level' : 'shakha-level';
      }

      if (modalType === 'attendance') {
        await api.put(`/attendance/${currentItemId}`, { records: attendanceData });
        toast.success('Attendance saved successfully');
        closeModal();
        return;
      }

      if (modalMode === 'add') {
        await api.post(endpoint, submitData);
        toast.success(`New ${modalType} added successfully`);
      } else {
        await api.put(`${endpoint}/${currentItemId}`, submitData);
        toast.success(`${modalType} updated successfully`);
      }
      closeModal();
      await fetchData(false);
    } catch (error) {
      toast.error(error.response?.data?.message || `Failed to save ${modalType}`);
    }
  };

  // Utilities
  const getShakhasDisplay = (shakhasArray) => {
    if (!shakhasArray || shakhasArray.length === 0) return <span className="text-gray-400 font-normal">N/A</span>;
    if (shakhasArray.length > 1) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold bg-saffron-100 text-saffron-800">
          Nagar-Level ({shakhasArray.length === data.shakhas.length ? 'All Shakhas' : `${shakhasArray.length} Shakhas`})
        </span>
      );
    }
    const shakhaId = shakhasArray[0];
    const id = typeof shakhaId === 'object' ? shakhaId._id : shakhaId;
    const shakha = data.shakhas.find(s => s._id === id);
    return shakha ? (
      <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
        {shakha.name}
      </span>
    ) : 'Unknown';
  };

  // Stats Data Null Checks
  const stats = [
    { label: 'Total Users', value: data?.users?.length || 0, icon: Users, color: 'text-orange-500' },
    { label: 'Total Shakhas', value: data?.shakhas?.length || 0, icon: MapPin, color: 'text-orange-500' },
    { label: 'Total Meetings', value: data?.meetings?.length || 0, icon: Calendar, color: 'text-orange-500' },
    { label: 'Total Events', value: data?.events?.length || 0, icon: Activity, color: 'text-orange-500' },
  ];

  // --- RENDERING TABS CONTENT (CARDS BASED) ---
  const renderContent = () => {
    if (loading) return <div className="p-10 text-center text-gray-500 flex flex-col items-center justify-center"><Activity className="w-8 h-8 animate-spin text-saffron-500 mb-4" /><span>Loading Data...</span></div>;

    switch (activeTab) {
      case 'shakhas':
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-xl font-bold text-gray-800">Shakhas </h3>
              <button onClick={() => openModal('shakha', 'add')} className="flex items-center bg-saffron-600 hover:bg-saffron-700 text-white px-4 py-2 rounded-xl shadow-sm text-sm font-medium transition-colors">
                <Plus className="w-4 h-4 mr-1" /> Add Shakha
              </button>
            </div>
            
            {(!data.shakhas || data.shakhas.length === 0) ? (
              <div className="text-center py-10 bg-white rounded-2xl shadow-sm"><p className="text-gray-500">No shakhas found.</p></div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {data.shakhas.map(item => (
                  <div key={item._id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow flex flex-col">
                    <h4 className="text-lg font-bold text-gray-900 mb-1">{item.name}</h4>
                    <p className="text-sm text-gray-500 mb-3 line-clamp-2">{item.location}</p>
                    
                    {item.contact && (
                      <span className="inline-flex w-fit items-center px-2.5 py-1 mb-4 rounded-lg text-xs font-medium bg-gray-100 text-gray-700">
                        {item.contact}
                      </span>
                    )}

                    {(item.karyavah?.name || item.mukhyaShikshak?.name) && (
                      <div className="mb-4 flex flex-wrap items-center text-[11px] text-gray-400 font-medium">
                        {item.karyavah?.name && <span>K: {item.karyavah.name}</span>}
                        {item.karyavah?.name && item.mukhyaShikshak?.name && <span className="mx-1.5">•</span>}
                        {item.mukhyaShikshak?.name && <span>M: {item.mukhyaShikshak.name}</span>}
                      </div>
                    )}

                    <div className="mt-auto flex items-center justify-between pt-4 border-t border-gray-50 gap-2">
                      <button onClick={() => { handleTabChange('users'); setSelectedShakhaFilter(item._id); }} className="flex-1 flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-xl text-sm font-medium transition-colors">
                        <Users className="w-4 h-4 mr-1.5" /> View Users
                      </button>
                      <button onClick={() => openModal('shakha', 'edit', item)} className="flex items-center justify-center bg-saffron-50 hover:bg-saffron-100 text-saffron-700 px-4 py-2 rounded-xl text-sm font-medium transition-colors">
                        <Edit2 className="w-4 h-4 mr-1.5" /> Edit
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      
      case 'meetings':
        return (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-2">
              <div className="flex items-center space-x-3">
                <h3 className="text-xl font-bold text-gray-800">Meetings</h3>
                <div className="flex bg-gray-100 p-1 rounded-lg">
                  <button onClick={() => setSubTab('upcoming')} className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${subTab === 'upcoming' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Upcoming</button>
                  <button onClick={() => setSubTab('history')} className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${subTab === 'history' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>History</button>
                </div>
              </div>
              <button onClick={() => openModal('meeting', 'add')} className="flex items-center justify-center bg-saffron-600 hover:bg-saffron-700 text-white px-4 py-2 rounded-xl shadow-sm text-sm font-medium transition-colors">
                <Plus className="w-4 h-4 mr-1" /> Add
              </button>
            </div>

            {(!data.meetings || data.meetings.length === 0) ? (
              <div className="text-center py-10 bg-white rounded-2xl shadow-sm"><p className="text-gray-500">No meetings found.</p></div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {data.meetings.filter(item => (subTab === 'upcoming' ? !isExpired(item) : isExpired(item))).map(item => (
                  <div key={item._id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow relative">
                    <div className="mb-2 flex justify-between items-start">
                       <div>
                         <h4 className="text-lg font-bold text-gray-900 mb-1">{item.displayTitle || item.title || 'Nagar Baithak'}</h4>
                         <p className="text-sm font-medium text-gray-500">
                           {formatDateToDDMMYYYY(item.date)} · {item.time}
                         </p>
                       </div>
                       <div className="ml-3 shrink-0 flex flex-col items-end">
                         <span className="text-xs font-bold text-green-700 bg-green-50 px-2.5 py-1 rounded-full border border-green-200 shadow-sm whitespace-nowrap">
                           {item.attendancePercentage !== undefined ? `${item.attendancePercentage}% Present` : '0% Present'}
                         </span>
                       </div>
                    </div>
                    
                    <div className="mb-3">
                      {getShakhasDisplay(item.shakhas)}
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">{item.location}</p>

                    <div className="flex items-center justify-start space-x-2 pt-3 border-t border-gray-50">
                      <button onClick={() => openModal('meeting', 'edit', item)} className="flex items-center text-saffron-600 bg-saffron-50 hover:bg-saffron-100 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors">
                        <Edit2 className="w-4 h-4 mr-1" /> Edit
                      </button>
                      <button onClick={() => deleteItem('meetings', item._id)} className="flex items-center text-gray-500 bg-gray-50 hover:bg-red-50 hover:text-red-600 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors">
                        <Trash2 className="w-4 h-4 mr-1" /> Delete
                      </button>
                      <button onClick={() => openModal('attendance', 'edit', item)} className="flex items-center text-green-600 bg-green-50 hover:bg-green-100 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ml-auto">
                        <ClipboardCheck className="w-4 h-4 mr-1" /> Attendance
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'events':
        return (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-2">
              <div className="flex items-center space-x-3">
                <h3 className="text-xl font-bold text-gray-800">Events</h3>
                <div className="flex bg-gray-100 p-1 rounded-lg">
                  <button onClick={() => setSubTab('upcoming')} className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${subTab === 'upcoming' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Upcoming</button>
                  <button onClick={() => setSubTab('history')} className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${subTab === 'history' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>History</button>
                </div>
              </div>
              <button onClick={() => openModal('event', 'add')} className="flex items-center justify-center bg-saffron-600 hover:bg-saffron-700 text-white px-4 py-2 rounded-xl shadow-sm text-sm font-medium transition-colors">
                <Plus className="w-4 h-4 mr-1" /> Add
              </button>
            </div>
            
            {(!data.events || data.events.length === 0) ? (
              <div className="text-center py-10 bg-white rounded-2xl shadow-sm"><p className="text-gray-500">No events found.</p></div>
            ) : (
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
               {data.events.filter(item => (subTab === 'upcoming' ? !isExpired(item) : isExpired(item))).map(item => (
                 <div key={item._id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow relative">
                   <h4 className="text-lg font-bold text-gray-900 mb-1 pr-10">{item.title}</h4>
                   <p className="text-sm font-medium text-gray-500 mb-3">
                     {formatDateToDDMMYYYY(item.date)}
                     {item.time && ` · ${item.time}`}
                   </p>
                   
                   <div className="mb-4">
                     {getShakhasDisplay(item.shakhas)}
                   </div>

                   <div className="flex items-center justify-start space-x-2 pt-3 border-t border-gray-50">
                     <button onClick={() => openModal('event', 'edit', item)} className="flex items-center text-saffron-600 bg-saffron-50 hover:bg-saffron-100 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors">
                       <Edit2 className="w-4 h-4 mr-1" /> Edit
                     </button>
                     <button onClick={() => deleteItem('events', item._id)} className="flex items-center text-gray-500 bg-gray-50 hover:bg-red-50 hover:text-red-600 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors">
                       <Trash2 className="w-4 h-4 mr-1" /> Delete
                     </button>
                   </div>
                 </div>
               ))}
             </div>
            )}
          </div>
        );

      case 'users':
        const safeUsers = data?.users || [];
        const displayedUsers = selectedShakhaFilter 
          ? safeUsers.filter(u => u?.shakha && u.shakha?._id === selectedShakhaFilter)
          : safeUsers;

        return (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-2">
              <h3 className="text-xl font-bold text-gray-800">Users ({displayedUsers.length})</h3>
              <div className="min-w-[200px]">
                <select 
                  value={selectedShakhaFilter || ''} 
                  onChange={(e) => setSelectedShakhaFilter(e.target.value)}
                  className="bg-white border-0 text-gray-700 text-sm rounded-xl focus:ring-saffron-500 block w-full p-2.5 shadow-sm py-3 font-medium cursor-pointer"
                >
                  <option value="">All Users</option>
                  {data.shakhas && data.shakhas.length > 0 ? data.shakhas.map(s => (
                    <option key={s._id} value={s._id}>{s.name}</option>
                  )) : <option disabled>No Shakhas Available</option>}
                </select>
              </div>
            </div>

            {usersError ? (
               <div className="text-center py-10 bg-white rounded-2xl shadow-sm"><p className="text-red-500 font-bold">Failed to load users.</p></div>
            ) : (!data.users || data.users.length === 0) ? (
               <div className="text-center py-10 bg-white rounded-2xl shadow-sm"><p className="text-gray-500">No users found.</p></div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {displayedUsers.map(user => (
                  <div key={user._id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-50 flex items-start space-x-3">
                    <div className="w-10 h-10 rounded-full bg-saffron-100 text-saffron-600 flex items-center justify-center shrink-0">
                      <span className="font-bold">{(user?.name || 'U').charAt(0).toUpperCase()}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900 truncate">{user?.name || 'Unknown User'}</p>
                      <p className="text-xs text-gray-500 truncate mb-1">{user?.email || user?.phone || 'N/A'}</p>
                      <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
                        <span className={`px-2 py-0.5 text-[10px] uppercase tracking-wider font-bold rounded-md ${user?.role === 'admin' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'}`}>
                          {user?.role || 'Member'}
                        </span>
                        {user?.shakha ? (
                          <span className="px-2 py-0.5 text-[10px] uppercase tracking-wider font-bold rounded-md bg-green-50 text-green-700 truncate max-w-[120px]" title={user?.shakha?.name || 'Shakha'}>
                            {user?.shakha?.name || 'Shakha'}
                          </span>
                        ) : user?.hasJoinRequest ? (
                          <span className="px-2 py-0.5 text-[10px] uppercase tracking-wider font-bold rounded-md bg-yellow-50 text-yellow-700">Pending</span>
                        ) : (
                          <span className="px-2 py-0.5 text-[10px] uppercase tracking-wider font-bold rounded-md bg-red-50 text-red-700">No Shakha</span>
                        )}
                        {user?.nagar && <span className="px-2 py-0.5 text-[10px] uppercase font-bold rounded-md bg-purple-50 text-purple-700">{user.nagar}</span>}
                      </div>
                    </div>
                    <button onClick={() => openModal('user', 'edit', user)} className="p-2 text-gray-400 hover:text-saffron-600 hover:bg-saffron-50 rounded-lg transition-colors shrink-0">
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      
      case 'joinRequests':
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-gray-800 mb-2">Join Requests ({data?.joinRequests?.length || 0})</h3>
            {(!data.joinRequests || data.joinRequests.length === 0) ? (
               <div className="text-center py-10 bg-white rounded-2xl shadow-sm"><p className="text-gray-500">No pending join requests.</p></div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {data.joinRequests.map(item => (
                  <div key={item._id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 relative">
                     <h4 className="text-base font-bold text-gray-900">{item.name}</h4>
                     <p className="text-sm text-gray-500 mb-2">{formatDateToDDMMYYYY(item.createdAt)}</p>
                     
                     <div className="bg-gray-50 p-3 rounded-xl mb-2 text-sm text-gray-700">
                       <p className="font-medium">{item.phone}</p>
                       {item.email && <p className="text-gray-500 text-xs">{item.email}</p>}
                     </div>
                     <p className="text-sm text-gray-600 line-clamp-2 mt-1">{item.address}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'notifications':
        return (
          <div className="space-y-4">
             <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-2">
              <div className="flex items-center space-x-3">
                <h3 className="text-xl font-bold text-gray-800">Notifications ({data.notifications?.length || 0})</h3>
                <div className="flex bg-gray-100 p-1 rounded-lg">
                  <button onClick={() => setSubTab('upcoming')} className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${subTab === 'upcoming' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Active</button>
                  <button onClick={() => setSubTab('history')} className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${subTab === 'history' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Past</button>
                </div>
              </div>
              <button onClick={() => openModal('notification', 'add')} className="flex items-center justify-center bg-saffron-600 hover:bg-saffron-700 text-white px-4 py-2 rounded-xl shadow-sm text-sm font-medium transition-colors">
                <Plus className="w-4 h-4 mr-1" /> Add
              </button>
            </div>

            {(!data.notifications || data.notifications.length === 0) ? (
               <div className="text-center py-10 bg-white rounded-2xl shadow-sm"><p className="text-gray-500">No notifications found.</p></div>
            ) : (
              <div className="flex flex-col gap-3">
                 {data.notifications.filter(item => (subTab === 'upcoming' ? !isExpired(item) : isExpired(item))).map(item => (
                    <div key={item._id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-50 flex justify-between items-start">
                      <div className="pr-4">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-base font-bold text-gray-900">{item.title}</h4>
                          {item.type === 'nagar-level' ? (
                            <span className="px-2 py-0.5 text-[10px] uppercase font-bold rounded-md bg-indigo-50 text-indigo-700">Nagar-Level</span>
                          ) : (
                            <span className="px-2 py-0.5 text-[10px] uppercase font-bold rounded-md bg-saffron-50 text-saffron-700">Shakha-Level</span>
                          )}
                        </div>
                        {item.date && item.time && (
                          <p className="text-xs text-gray-400 font-medium mb-1">
                            Expires: {formatDateToDDMMYYYY(item.date)} · {item.time}
                          </p>
                        )}
                        <p className="text-sm text-gray-600">{item.message}</p>
                      </div>
                      <button onClick={() => deleteItem('notifications', item._id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                         <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                 ))}
              </div>
            )}
          </div>
        );

      case 'groups':
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-xl font-bold text-gray-800">Groups ({data.groups?.length || 0})</h3>
              <button onClick={() => openModal('group', 'add')} className="flex items-center bg-saffron-600 hover:bg-saffron-700 text-white px-4 py-2 rounded-xl shadow-sm text-sm font-medium transition-colors">
                <Plus className="w-4 h-4 mr-1" /> Add Group
              </button>
            </div>
            
            {(!data.groups || data.groups.length === 0) ? (
               <div className="text-center py-10 bg-white rounded-2xl shadow-sm"><p className="text-gray-500">No groups found.</p></div>
            ) : (
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                 {data.groups.map(item => (
                    <div key={item._id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition">
                      <div>
                        <h4 className="text-lg font-bold text-gray-900 mb-1">{item.name}</h4>
                        <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                          {item.users?.length || 0} Member(s)
                        </span>
                      </div>
                      <div className="flex items-center justify-start space-x-2 pt-3 mt-4 border-t border-gray-50">
                         <button onClick={() => openModal('group', 'edit', item)} className="flex items-center text-saffron-600 bg-saffron-50 hover:bg-saffron-100 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors">
                           <Edit2 className="w-4 h-4 mr-1" /> Edit
                         </button>
                         <button onClick={() => deleteItem('groups', item._id)} className="flex items-center text-gray-500 bg-gray-50 hover:bg-red-50 hover:text-red-600 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors">
                           <Trash2 className="w-4 h-4 mr-1" /> Delete
                         </button>
                      </div>
                    </div>
                 ))}
               </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  // --- MODAL FORMS ---
  const renderTargetAudienceFields = (inputClass) => (
    <div className="space-y-4 pt-2 border-t border-gray-100 mt-2">
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Target Audience</label>
        <select 
          name="targetType" 
          value={formData.targetType || 'all'} 
          onChange={(e) => {
            setFormData(prev => ({ ...prev, targetType: e.target.value, targetValue: '', shakhas: e.target.value === 'all' ? data.shakhas.map(s => s._id) : [] }));
          }} 
          className={inputClass}
        >
          <option value="all">All Users</option>
          <option value="shakha">Specific Shakha</option>
          <option value="nagar">Specific Nagar</option>
          <option value="group">Custom Group</option>
        </select>
      </div>

      {formData.targetType === 'shakha' && (
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Select Shakha</label>
          <select name="targetValue" value={formData.targetValue || ''} onChange={handleInputChange} className={inputClass} required>
            <option value="">-- Select a Shakha --</option>
            {data.shakhas.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
          </select>
        </div>
      )}

      {formData.targetType === 'nagar' && (
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nagar Name</label>
          <input name="targetValue" value={formData.targetValue || ''} onChange={handleInputChange} className={inputClass} placeholder="e.g. Nagar Todi" required />
        </div>
      )}

      {formData.targetType === 'group' && (
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Select Group</label>
          <select name="targetValue" value={formData.targetValue || ''} onChange={handleInputChange} className={inputClass} required>
            <option value="">-- Select a Group --</option>
            {data.groups && data.groups.map(g => <option key={g._id} value={g._id}>{g.name}</option>)}
          </select>
        </div>
      )}
    </div>
  );

  const renderModalForm = () => {
    const inputClass = "w-full border-gray-300 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-saffron-500 focus:border-transparent rounded-xl p-3 text-sm transition-colors border";
    
    if (modalType === 'attendance') {
      const safeAttendanceData = Array.isArray(attendanceData) ? attendanceData : [];
      
      const filteredUsers = safeAttendanceData.filter(r => 
        r.user?.name?.toLowerCase().includes(attendanceSearch.toLowerCase()) || 
        r.user?.email?.toLowerCase().includes(attendanceSearch.toLowerCase())
      ).sort((a, b) => (a.user?.name || '').localeCompare(b.user?.name || ''));
      
      const presentCount = safeAttendanceData.filter(r => r.status === 'present').length;
      const absentCount = safeAttendanceData.length - presentCount;
      const percentage = safeAttendanceData.length > 0 ? Math.round((presentCount / safeAttendanceData.length) * 100) : 0;

      return (
        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-xl flex justify-between items-center border border-gray-100">
            <div>
              <p className="text-sm text-gray-500 font-medium uppercase tracking-wider">Attendance</p>
              <p className="text-2xl font-bold text-gray-900">{percentage}%</p>
            </div>
            <div className="flex space-x-4 text-center">
              <div>
                <p className="text-xl font-bold text-green-600">{presentCount}</p>
                <p className="text-xs text-gray-500 uppercase tracking-wider">Present</p>
              </div>
              <div>
                <p className="text-xl font-bold text-red-500">{absentCount}</p>
                <p className="text-xs text-gray-500 uppercase tracking-wider">Absent</p>
              </div>
            </div>
          </div>
          
          <div className="flex space-x-2">
            <button 
              type="button"
              onClick={() => setAttendanceData(prev => prev.map(r => ({ ...r, status: 'present' })))}
              className="flex-1 bg-green-50 text-green-700 hover:bg-green-100 py-2 rounded-xl text-sm font-bold transition-colors"
            >
              Mark All Present
            </button>
            <button 
              type="button"
              onClick={() => setAttendanceData(prev => prev.map(r => ({ ...r, status: 'absent' })))}
              className="flex-1 bg-red-50 text-red-700 hover:bg-red-100 py-2 rounded-xl text-sm font-bold transition-colors"
            >
              Mark All Absent
            </button>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search users..." 
              value={attendanceSearch}
              onChange={(e) => setAttendanceSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-saffron-500"
            />
          </div>

          <div className="border border-gray-200 rounded-xl max-h-72 overflow-y-auto bg-white flex flex-col divide-y divide-gray-100">
            {filteredUsers.length === 0 ? (
              <p className="text-center py-6 text-sm text-gray-500">No users found.</p>
            ) : filteredUsers.map(record => (
              <div key={record.user?._id} className="flex items-center justify-between p-3 hover:bg-gray-50 transition-colors">
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-gray-900">{record.user?.name || 'Unknown User'}</span>
                  <span className="text-xs text-gray-500">{record.user?.email || record.user?.phone}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setAttendanceData(prev => prev.map(r => 
                      r.user?._id === record.user?._id ? { ...r, status: r.status === 'present' ? 'absent' : 'present' } : r
                    ));
                  }}
                  className={`flex items-center px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                    record.status === 'present' ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-100 text-red-700 hover:bg-red-200'
                  }`}
                >
                  {record.status === 'present' ? (
                    <><CheckCircle className="w-3.5 h-3.5 mr-1" /> Present</>
                  ) : (
                    <><XCircle className="w-3.5 h-3.5 mr-1" /> Absent</>
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      );
    }
    
    if (modalType === 'group') {
      return (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Group Name</label>
            <input required name="name" value={formData.name || ''} onChange={handleInputChange} className={inputClass} placeholder="e.g. Core Committee" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Description</label>
            <textarea name="description" value={formData.description || ''} onChange={handleInputChange} className={inputClass} rows="3" placeholder="Details about this group..." />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Group Members</label>
            <div className="border border-gray-200 rounded-xl max-h-48 overflow-y-auto bg-gray-50 flex flex-col p-2">
              <div className="px-1 space-y-1">
                {data.users && data.users.length > 0 ? data.users.map(u => (
                  <label key={u._id} className="flex items-center space-x-3 py-1.5 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={(formData.users || []).includes(u._id)}
                      onChange={(e) => {
                        const current = formData.users || [];
                        const newValue = e.target.checked 
                          ? [...current, u._id] 
                          : current.filter(id => id !== u._id);
                        setFormData(prev => ({ ...prev, users: newValue }));
                      }}
                      className="rounded text-saffron-600 focus:ring-saffron-500 w-4 h-4"
                    />
                    <div className="flex flex-col">
                      <span className="text-sm text-gray-700 font-bold">{u.name}</span>
                      <span className="text-xs text-gray-500">{u.email || u.phone}</span>
                    </div>
                  </label>
                )) : <span className="text-sm text-gray-500 p-2">No users found</span>}
              </div>
            </div>
          </div>
        </div>
      );
    } else if (modalType === 'user') {
      return (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Role</label>
            <select name="role" value={formData.role || 'user'} onChange={handleInputChange} className={inputClass}>
              <option value="user">User</option>
              <option value="member">Member</option>
              <option value="shikshak">Shikshak</option>
              <option value="karyavah">Karyavah</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nagar</label>
            <input name="nagar" value={formData.nagar || ''} onChange={handleInputChange} className={inputClass} placeholder="Enter Nagar (e.g., Nagar Todi)" />
          </div>
        </div>
      );
    } else if (modalType === 'shakha') {
      return (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Name</label>
            <input required name="name" value={formData.name || ''} onChange={handleInputChange} className={inputClass} placeholder="e.g. Royal School Shakha" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Location</label>
            <input required name="location" value={formData.location || ''} onChange={handleInputChange} className={inputClass} placeholder="Full address" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Description</label>
            <textarea name="description" value={formData.description || ''} onChange={handleInputChange} className={inputClass} rows="3" placeholder="Optional details..." />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Timing Details</label>
            <input name="contact" value={formData.contact || ''} onChange={handleInputChange} className={inputClass} placeholder="e.g. Every Morning · 6:00 AM" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Karyavah Name</label>
              <input name="karyavah.name" value={formData.karyavah?.name || ''} onChange={handleInputChange} className={inputClass} placeholder="Name" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Contact</label>
              <input name="karyavah.contact" value={formData.karyavah?.contact || ''} onChange={handleInputChange} className={inputClass} placeholder="Phone" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Mukhya Shikshak Name</label>
              <input name="mukhyaShikshak.name" value={formData.mukhyaShikshak?.name || ''} onChange={handleInputChange} className={inputClass} placeholder="Name" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Contact</label>
              <input name="mukhyaShikshak.contact" value={formData.mukhyaShikshak?.contact || ''} onChange={handleInputChange} className={inputClass} placeholder="Phone" />
            </div>
          </div>
        </div>
      );
    } else if (modalType === 'meeting' || modalType === 'event') {
      return (
        <div className="space-y-4">
          {modalType === 'event' && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Event Title</label>
              <input required name="title" value={formData.title || ''} onChange={handleInputChange} className={inputClass} placeholder="Event Name" />
            </div>
          )}
          
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Date</label>
            <input required type="date" name="date" min={new Date().toISOString().split('T')[0]} value={formData.date || ''} onChange={handleInputChange} className={inputClass} />
          </div>
          
          {(modalType === 'meeting' || modalType === 'event') && (
             <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Time</label>
              <input required type="time" name="time" value={formData.time || ''} onChange={handleInputChange} className={inputClass} />
            </div>
          )}

          <div>
             <label className="block text-sm font-semibold text-gray-700 mb-1.5">{modalType === 'meeting' ? 'Location / Link' : 'Description'}</label>
             {modalType === 'meeting' ? 
               <input required name="location" value={formData.location || ''} onChange={handleInputChange} className={inputClass} placeholder="Venue or Online Link" /> :
               <textarea required name="description" value={formData.description || ''} onChange={handleInputChange} className={inputClass} rows="3" placeholder="Event info..." />
             }
          </div>

          {renderTargetAudienceFields(inputClass)}
          
          {(formData.targetType === 'all' || !formData.targetType) && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Target Shakhas (Legacy)</label>
              <div className="border border-gray-200 rounded-xl max-h-48 overflow-y-auto bg-gray-50 flex flex-col p-2">
                <label className="flex items-center space-x-3 p-2 bg-white rounded-lg shadow-sm mb-2 border border-blue-100 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={(formData.shakhas || []).length === data.shakhas.length && data.shakhas.length > 0}
                    onChange={(e) => {
                      const allIds = data.shakhas.map(s => s._id);
                      setFormData(prev => ({ ...prev, shakhas: e.target.checked ? allIds : [] }));
                    }}
                    className="rounded text-saffron-600 focus:ring-saffron-500 w-4 h-4 cursor-pointer"
                  />
                  <span className="font-bold text-sm text-gray-800">Select All (Nagar-Level)</span>
                </label>
                <div className="px-1 space-y-1">
                  {data.shakhas.map(s => (
                    <label key={s._id} className="flex items-center space-x-3 py-1.5 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={(formData.shakhas || []).includes(s._id)}
                        onChange={(e) => {
                          const current = formData.shakhas || [];
                          const newValue = e.target.checked 
                            ? [...current, s._id] 
                            : current.filter(id => id !== s._id);
                          setFormData(prev => ({ ...prev, shakhas: newValue }));
                        }}
                        className="rounded text-saffron-600 focus:ring-saffron-500 w-4 h-4"
                      />
                      <span className="text-sm text-gray-700 font-medium">{s.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      );
    } else if (modalType === 'notification') {
        // notification form logic
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Notification Title</label>
              <input required name="title" value={formData.title || ''} onChange={handleInputChange} className={inputClass} placeholder="Alert title" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Message</label>
              <textarea required name="message" value={formData.message || ''} onChange={handleInputChange} className={inputClass} rows="4" placeholder="Enter message..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Expiry Date</label>
                <input required type="date" name="date" min={new Date().toISOString().split('T')[0]} value={formData.date || ''} onChange={handleInputChange} className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Expiry Time</label>
                <input required type="time" name="time" value={formData.time || ''} onChange={handleInputChange} className={inputClass} />
              </div>
            </div>

            {renderTargetAudienceFields(inputClass)}
            
            {(formData.targetType === 'all' || !formData.targetType) && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Select Target Shakhas (Legacy)</label>
                <div className="border border-gray-200 rounded-xl max-h-48 overflow-y-auto bg-gray-50 flex flex-col p-2">
                  <label className="flex items-center space-x-3 p-2 bg-white rounded-lg shadow-sm mb-2 border border-blue-100 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={(formData.shakhas || []).length === data.shakhas.length && data.shakhas.length > 0}
                      onChange={(e) => {
                        const allIds = data.shakhas.map(s => s._id);
                        setFormData(prev => ({ ...prev, shakhas: e.target.checked ? allIds : [] }));
                      }}
                      className="rounded text-saffron-600 focus:ring-saffron-500 w-4 h-4"
                    />
                    <span className="font-bold text-sm text-gray-800">Send to All (Nagar-Level)</span>
                  </label>
                  <div className="px-1 space-y-1">
                    {data.shakhas.map(s => (
                      <label key={s._id} className="flex items-center space-x-3 py-1.5 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={(formData.shakhas || []).includes(s._id)}
                          onChange={(e) => {
                            const current = formData.shakhas || [];
                            const newValue = e.target.checked 
                              ? [...current, s._id] 
                              : current.filter(id => id !== s._id);
                            setFormData(prev => ({ ...prev, shakhas: newValue }));
                          }}
                          className="rounded text-saffron-600 focus:ring-saffron-500 w-4 h-4"
                        />
                        <span className="text-sm text-gray-700 font-medium">{s.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-transparent flex flex-col font-sans">
      
      {/* MAIN CONTENT AREA */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-6 md:py-8 lg:py-10 pb-20">
         
         {/* 2. STATS CARDS GRID */}
         <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 md:mb-8">
            {stats.map((stat, idx) => {
              const Icon = stat.icon;
              return (
                 <div key={idx} className="bg-white rounded-2xl p-4 md:p-5 shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition">
                    <div className="flex justify-between items-start mb-2">
                       <span className={`p-2.5 rounded-xl bg-orange-50 ${stat.color} mb-1 md:mb-2`}>
                         <Icon className="w-5 h-5" />
                       </span>
                       {/* Optional dot indicator or small chart can go here */}
                    </div>
                    <div>
                       <h3 className="text-2xl md:text-3xl font-black text-gray-900 leading-tight">{stat.value}</h3>
                       <p className="text-xs md:text-sm font-medium text-gray-500">{stat.label}</p>
                    </div>
                 </div>
              )
            })}
         </div>

         {/* 3. TABS NAVIGATION (HORIZONTAL) */}
         <div className="mb-6 border-b border-gray-200 pb-2 overflow-x-auto hide-scrollbar">
            <nav className="flex space-x-2 md:space-x-3 w-max px-1">
               {[ 
                 { id: 'shakhas', label: 'Shakhas' },
                 { id: 'meetings', label: 'Meetings' },
                 { id: 'events', label: 'Events' },
                 { id: 'users', label: 'Users' },
                 { id: 'notifications', label: 'Notifications' },
                 { id: 'joinRequests', label: 'Join Requests' },
                 { id: 'groups', label: 'Groups' }
               ].map(tab => (
                  <button 
                     key={tab.id}
                     onClick={() => handleTabChange(tab.id)}
                     className={`px-4 md:px-5 py-2.5 rounded-full whitespace-nowrap text-sm font-bold transition-all ${activeTab === tab.id ? 'bg-saffron-600 text-white shadow-md' : 'bg-gray-200/70 text-gray-600 hover:bg-gray-300'}`}
                  >
                     {tab.label}
                  </button>
               ))}
            </nav>
         </div>

         {/* 4. DYNAMIC TAB CONTENT */}
         <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 ease-out pb-10">
           {renderContent()}
         </div>
      </main>

      {/* 5. GENERIC UI MODAL OVERLAY */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity" onClick={closeModal} />
          
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col z-10 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh]">
            <div className="flex justify-between items-center bg-gray-50 border-b p-5">
              <h2 className="text-xl font-bold capitalize text-gray-800">{modalMode} {modalType}</h2>
              <button type="button" onClick={closeModal} className="text-gray-400 hover:text-gray-700 bg-white hover:bg-gray-100 rounded-full p-1.5 transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="flex flex-col overflow-hidden">
              <div className="overflow-y-auto p-5">
                {renderModalForm()}
              </div>
              
              <div className="p-5 border-t border-gray-100 bg-gray-50 flex justify-end space-x-3 shrink-0">
                <button type="button" onClick={closeModal} className="px-5 py-2.5 text-sm font-bold text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl transition-colors">
                  Cancel
                </button>
                <button type="submit" className="px-6 py-2.5 text-sm font-bold text-white bg-saffron-600 hover:bg-saffron-700 border border-transparent shadow-sm rounded-xl transition-colors">
                  {modalMode === 'add' ? 'Create' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

    </div>
  );
};

export default Dashboard;
