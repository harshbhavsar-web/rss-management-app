import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, Calendar, CheckSquare, Plus, Edit2, 
  Trash2, X, ClipboardCheck, Activity, Search, CheckCircle, XCircle, Clock, MapPin
} from 'lucide-react';
import api from '../utils/api';
import { toast } from 'sonner';
import { formatDateToDDMMYYYY } from '../utils/dateUtils';

const ShakhaDashboard = () => {
  const navigate = useNavigate();

  // Basic User and Role Info
  const userRole = localStorage.getItem('userRole');
  const isLeader = userRole === 'karyvah' || userRole === 'mukhya_shikshak';

  // State
  const [userProfile, setUserProfile] = useState(null);
  const [activeTab, setActiveTab] = useState('members'); // 'members', 'attendance', 'meetings', 'events'
  const [loading, setLoading] = useState(true);
  
  const [members, setMembers] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [events, setEvents] = useState([]);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState('meeting'); // 'meeting', 'event', 'attendance'
  const [modalMode, setModalMode] = useState('add'); // 'add', 'edit'
  const [currentItemId, setCurrentItemId] = useState(null);
  
  // Forms & Attendance States
  const [formData, setFormData] = useState({});
  const [attendanceData, setAttendanceData] = useState([]);
  const [attendanceSearch, setAttendanceSearch] = useState('');

  useEffect(() => {
    if (!isLeader) {
      navigate('/home');
      return;
    }
    loadDashboard();
  }, [isLeader, navigate]);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      // 1. Get current user's profile to retrieve assigned Shakha ID
      const profileRes = await api.get('/users/me');
      const profile = profileRes.data;
      setUserProfile(profile);

      if (!profile.shakha) {
        toast.error('You are not assigned to any Shakha yet.');
        setLoading(false);
        return;
      }

      const shakhaId = typeof profile.shakha === 'object' ? profile.shakha._id : profile.shakha;

      // 2. Fetch members, meetings, and events
      const [membersRes, meetingsRes, eventsRes] = await Promise.all([
        api.get('/users'), // returns only own shakha members due to controller update
        api.get('/meetings'),
        api.get('/events')
      ]);

      setMembers(membersRes.data || []);
      
      // Filter meetings & events for their assigned Shakha
      const filteredMeetings = meetingsRes.data.filter(m => 
        m.shakhaId?._id === shakhaId || 
        m.shakhaId === shakhaId || 
        m.targetValue === shakhaId || 
        (m.shakhas && m.shakhas.some(s => s._id === shakhaId || s === shakhaId))
      );
      setMeetings(filteredMeetings.sort((a, b) => new Date(b.date) - new Date(a.date)));

      const filteredEvents = eventsRes.data.filter(e => 
        e.shakhaId?._id === shakhaId || 
        e.shakhaId === shakhaId || 
        e.targetValue === shakhaId || 
        (e.shakhas && e.shakhas.some(s => s._id === shakhaId || s === shakhaId))
      );
      setEvents(filteredEvents.sort((a, b) => new Date(b.date) - new Date(a.date)));

    } catch (error) {
      console.error('Failed to load leader dashboard:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const openModal = async (type, mode, item = null) => {
    setModalType(type);
    setModalMode(mode);
    setCurrentItemId(item ? item._id : null);

    if (mode === 'edit' && item) {
      setFormData({ ...item });
    } else {
      setFormData({});
    }

    if (type === 'attendance') {
      try {
        const res = await api.get(`/attendance/${item._id}`);
        setAttendanceData(res.data.records || []);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const shakhaId = typeof userProfile.shakha === 'object' ? userProfile.shakha._id : userProfile.shakha;
      let endpoint = modalType === 'meeting' ? '/meetings' : '/events';

      if (modalType === 'attendance') {
        await api.put(`/attendance/${currentItemId}`, { records: attendanceData });
        toast.success('Attendance saved successfully');
        closeModal();
        loadDashboard();
        return;
      }

      const submitData = {
        ...formData,
        shakhas: [shakhaId],
        targetType: 'shakha',
        targetValue: shakhaId
      };

      if (modalMode === 'add') {
        await api.post(endpoint, submitData);
        toast.success(`New ${modalType} created!`);
      } else {
        await api.put(`${endpoint}/${currentItemId}`, submitData);
        toast.success(`${modalType} updated!`);
      }

      closeModal();
      loadDashboard();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save');
    }
  };

  const deleteItem = async (type, id) => {
    if (!window.confirm(`Are you sure you want to delete this ${type}?`)) return;
    try {
      await api.delete(`/${type}/${id}`);
      toast.success('Deleted successfully');
      loadDashboard();
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-24 pb-20 flex flex-col justify-center items-center text-gray-500 bg-[#faf8f5]">
        <Activity className="w-10 h-10 animate-spin text-[#e65c00] mb-4" />
        <span>Loading Dashboard...</span>
      </div>
    );
  }

  const shakhaName = userProfile?.shakha?.name || 'Your Shakha';

  return (
    <div className="bg-[#faf8f5] min-h-screen pt-20 pb-28 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Hero Section */}
        <div className="bg-[#e65c00] text-white rounded-3xl p-6 md:p-8 shadow-md relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full blur-3xl pointer-events-none"></div>
          <div>
            <h1 className="text-3xl font-black mb-1">{shakhaName} Dashboard</h1>
            <p className="opacity-90 text-sm font-medium">Manage members, mark attendance, and manage scheduled meetings/events.</p>
          </div>
          <div className="shrink-0 flex gap-2">
            <button onClick={() => openModal('meeting', 'add')} className="bg-white text-[#e65c00] px-4 py-2.5 rounded-xl font-bold text-sm shadow hover:bg-orange-50 transition active:scale-95">
              + New Meeting
            </button>
            <button onClick={() => openModal('event', 'add')} className="bg-white/20 text-white border border-white/20 px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-white/30 transition active:scale-95">
              + New Event
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex bg-white p-1 rounded-2xl shadow-sm border border-gray-100 max-w-md">
          {[
            { id: 'members', label: 'Members', icon: Users },
            { id: 'attendance', label: 'Attendance', icon: ClipboardCheck },
            { id: 'meetings', label: 'Meetings', icon: Calendar },
            { id: 'events', label: 'Events', icon: CheckSquare }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex flex-col sm:flex-row items-center justify-center gap-1.5 py-3 rounded-xl text-xs font-bold transition-all ${
                  activeTab === tab.id 
                    ? 'bg-[#e65c00] text-white shadow-sm' 
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Contents */}
        <div className="mt-4">
          
          {/* members view */}
          {activeTab === 'members' && (
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-gray-900 px-1">Swayamsevaks ({members.length})</h3>
              {members.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-2xl border"><p className="text-gray-500 font-semibold">No registered Swayamsevaks found.</p></div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {members.map(m => (
                    <div key={m._id} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center gap-4 hover:shadow-md transition">
                      <div className="w-12 h-12 rounded-full bg-saffron-50 text-[#e65c00] flex items-center justify-center font-black text-lg">
                        {m.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-gray-900 text-base truncate">{m.name}</p>
                        <p className="text-sm text-gray-500 truncate mt-0.5">{m.phone || m.email || 'No contact details'}</p>
                        <span className="inline-block mt-2 px-2 py-0.5 text-[10px] font-extrabold bg-gray-100 text-gray-600 rounded-md uppercase tracking-wider">
                          {m.role === 'user' ? 'Member' : m.role}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Attendance View */}
          {activeTab === 'attendance' && (
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-gray-900 px-1">Attendance Manager</h3>
              {meetings.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-2xl border"><p className="text-gray-500 font-semibold">No meetings scheduled to manage attendance.</p></div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {meetings.map(item => (
                    <div key={item._id} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-md transition h-full">
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-bold text-lg text-gray-900 leading-tight truncate">{item.displayTitle || item.title || 'Nagar Baithak'}</h4>
                          <span className={`text-[11px] font-black uppercase px-2.5 py-1 rounded-full ${
                            item.status === 'completed' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                          }`}>
                            {item.status === 'completed' 
                              ? `${item.attendancePercentage !== undefined ? item.attendancePercentage : 0}% Present` 
                              : 'Pending'
                            }
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 font-bold mb-3">{formatDateToDDMMYYYY(item.date)} @ {item.time}</p>
                        <p className="text-sm text-gray-600 truncate mb-4"><MapPin className="w-4 h-4 text-[#e65c00] inline mr-1" />{item.location}</p>
                      </div>
                      <button 
                        onClick={() => openModal('attendance', 'edit', item)} 
                        className="w-full flex items-center justify-center bg-saffron-50 hover:bg-saffron-100 text-saffron-700 py-2.5 rounded-xl text-sm font-bold transition-all duration-200"
                      >
                        <ClipboardCheck className="w-4 h-4 mr-2" /> 
                        {item.status === 'completed' ? 'Edit Attendance' : 'Mark Attendance'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Meetings View */}
          {activeTab === 'meetings' && (
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-gray-900 px-1">Meetings list</h3>
              {meetings.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-2xl border"><p className="text-gray-500 font-semibold">No meetings found.</p></div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {meetings.map(item => (
                    <div key={item._id} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-md transition h-full">
                      <div>
                        <h4 className="font-bold text-lg text-gray-900 leading-tight mb-2 truncate">{item.displayTitle || item.title || 'Nagar Baithak'}</h4>
                        <div className="space-y-1.5 text-sm text-gray-600 mb-4">
                          <p><Clock className="w-4 h-4 text-[#e65c00] inline mr-2" />{formatDateToDDMMYYYY(item.date)} @ {item.time}</p>
                          <p><MapPin className="w-4 h-4 text-[#e65c00] inline mr-2" />{item.location}</p>
                        </div>
                      </div>
                      <div className="flex gap-2 pt-3 border-t border-gray-50 mt-4">
                        <button onClick={() => openModal('meeting', 'edit', item)} className="flex-1 flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-xl text-sm font-semibold transition">
                          <Edit2 className="w-3.5 h-3.5 mr-1.5" /> Edit
                        </button>
                        <button onClick={() => deleteItem('meetings', item._id)} className="flex-1 flex items-center justify-center bg-red-50 hover:bg-red-100 text-red-600 py-2 rounded-xl text-sm font-semibold transition">
                          <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Events View */}
          {activeTab === 'events' && (
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-gray-900 px-1">Events list</h3>
              {events.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-2xl border"><p className="text-gray-500 font-semibold">No events found.</p></div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {events.map(item => (
                    <div key={item._id} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-md transition h-full">
                      <div>
                        <h4 className="font-bold text-lg text-gray-900 leading-tight mb-2 truncate">{item.title}</h4>
                        <p className="text-xs text-gray-500 font-bold mb-3">{formatDateToDDMMYYYY(item.date)} {item.time && ` @ ${item.time}`}</p>
                        <p className="text-sm text-gray-600 leading-relaxed mb-4 line-clamp-2">{item.description}</p>
                      </div>
                      <div className="flex gap-2 pt-3 border-t border-gray-50 mt-4">
                        <button onClick={() => openModal('event', 'edit', item)} className="flex-1 flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-xl text-sm font-semibold transition">
                          <Edit2 className="w-3.5 h-3.5 mr-1.5" /> Edit
                        </button>
                        <button onClick={() => deleteItem('events', item._id)} className="flex-1 flex items-center justify-center bg-red-50 hover:bg-red-100 text-red-600 py-2 rounded-xl text-sm font-semibold transition">
                          <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* Modal Form Overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[32px] p-6 md:p-8 max-w-lg w-full shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <button onClick={closeModal} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-full transition">
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-2xl font-black text-gray-900 mb-6 capitalize">{modalMode} {modalType}</h3>

            <form onSubmit={handleSubmit} className="space-y-5">
              {modalType === 'attendance' ? (
                <div className="space-y-4">
                  {/* Attendance Sub Form */}
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input 
                      type="text" 
                      placeholder="Search users..." 
                      value={attendanceSearch}
                      onChange={(e) => setAttendanceSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-saffron-500"
                    />
                  </div>

                  <div className="flex space-x-2">
                    <button 
                      type="button"
                      onClick={() => setAttendanceData(prev => prev.map(r => ({ ...r, status: 'present' })))}
                      className="flex-1 bg-green-50 text-green-700 hover:bg-green-100 py-2 rounded-xl text-sm font-bold transition-colors"
                    >
                      All Present
                    </button>
                    <button 
                      type="button"
                      onClick={() => setAttendanceData(prev => prev.map(r => ({ ...r, status: 'absent' })))}
                      className="flex-1 bg-red-50 text-red-700 hover:bg-red-100 py-2 rounded-xl text-sm font-bold transition-colors"
                    >
                      All Absent
                    </button>
                  </div>

                  <div className="border border-gray-200 rounded-2xl divide-y divide-gray-100 overflow-y-auto max-h-60 bg-white">
                    {attendanceData.filter(r => r.user?.name?.toLowerCase().includes(attendanceSearch.toLowerCase())).length === 0 ? (
                      <p className="text-center py-6 text-sm text-gray-500">No users found.</p>
                    ) : attendanceData
                        .filter(r => r.user?.name?.toLowerCase().includes(attendanceSearch.toLowerCase()))
                        .map(record => (
                          <div key={record.user?._id} className="flex items-center justify-between p-3">
                            <div>
                              <p className="text-sm font-bold text-gray-900">{record.user?.name}</p>
                              <p className="text-xs text-gray-500">{record.user?.phone || record.user?.email}</p>
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
                        ))
                    }
                  </div>
                </div>
              ) : modalType === 'meeting' ? (
                <div className="space-y-4">
                  {/* Meeting Sub Form */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Meeting Date</label>
                    <input type="date" required name="date" value={formData.date ? formData.date.split('T')[0] : ''} onChange={handleInputChange} className="w-full border border-gray-200 bg-gray-50 rounded-xl p-3 text-sm focus:ring-2 focus:ring-saffron-500 focus:bg-white transition-colors" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Time</label>
                    <input type="time" required name="time" value={formData.time || ''} onChange={handleInputChange} className="w-full border border-gray-200 bg-gray-50 rounded-xl p-3 text-sm focus:ring-2 focus:ring-saffron-500 focus:bg-white transition-colors" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Location</label>
                    <input type="text" required name="location" value={formData.location || ''} onChange={handleInputChange} className="w-full border border-gray-200 bg-gray-50 rounded-xl p-3 text-sm focus:ring-2 focus:ring-saffron-500 focus:bg-white transition-colors" placeholder="e.g. Shakha Grounds" />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Event Sub Form */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Event Title</label>
                    <input type="text" required name="title" value={formData.title || ''} onChange={handleInputChange} className="w-full border border-gray-200 bg-gray-50 rounded-xl p-3 text-sm focus:ring-2 focus:ring-saffron-500 focus:bg-white transition-colors" placeholder="e.g. Guru Puja" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Event Date</label>
                    <input type="date" required name="date" value={formData.date ? formData.date.split('T')[0] : ''} onChange={handleInputChange} className="w-full border border-gray-200 bg-gray-50 rounded-xl p-3 text-sm focus:ring-2 focus:ring-saffron-500 focus:bg-white transition-colors" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Time (Optional)</label>
                    <input type="time" name="time" value={formData.time || ''} onChange={handleInputChange} className="w-full border border-gray-200 bg-gray-50 rounded-xl p-3 text-sm focus:ring-2 focus:ring-saffron-500 focus:bg-white transition-colors" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Location (Optional)</label>
                    <input type="text" name="location" value={formData.location || ''} onChange={handleInputChange} className="w-full border border-gray-200 bg-gray-50 rounded-xl p-3 text-sm focus:ring-2 focus:ring-saffron-500 focus:bg-white transition-colors" placeholder="e.g. Community Hall" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Description</label>
                    <textarea name="description" value={formData.description || ''} onChange={handleInputChange} className="w-full border border-gray-200 bg-gray-50 rounded-xl p-3 text-sm focus:ring-2 focus:ring-saffron-500 focus:bg-white transition-colors" rows="3" placeholder="Event details..." />
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={closeModal} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3.5 rounded-2xl font-bold text-sm transition">
                  Cancel
                </button>
                <button type="submit" className="flex-1 bg-[#e65c00] hover:bg-[#cc5200] text-white py-3.5 rounded-2xl font-bold text-sm shadow-md transition">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShakhaDashboard;
