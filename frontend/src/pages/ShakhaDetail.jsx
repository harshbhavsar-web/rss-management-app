import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MapPin, Phone, Calendar, Clock, ChevronLeft, UserCircle2, Plus, Edit2, Trash2, X, ClipboardCheck, Search, CheckCircle, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { formatDateToDDMMYYYY } from '../utils/dateUtils';
import { toast } from 'sonner';


const ShakhaDetail = () => {
   const { id } = useParams();
   const { t } = useTranslation();
   const [shakha, setShakha] = useState(null);
   const [meetings, setMeetings] = useState([]);
   const [events, setEvents] = useState([]);
   const [members, setMembers] = useState([]);
   const [loading, setLoading] = useState(true);

   // Role & permission resolution
   const userRole = localStorage.getItem('userRole');
   const adminToken = localStorage.getItem('adminToken');
   const isAdmin = adminToken || userRole === 'admin';
   const isManager = userRole === 'karyvah' || userRole === 'mukhya_shikshak';
   const isAuthorizedToViewMembers = isAdmin || isManager;

   // The user profile (needed to compare assigned Shakha for managers)
   const [userProfile, setUserProfile] = useState(null);
   // True only when a manager is viewing their OWN assigned Shakha
   const [isOwnShakha, setIsOwnShakha] = useState(false);

   // Management modal state (only for isManager && isOwnShakha)
   const [isModalOpen, setIsModalOpen] = useState(false);
   const [modalType, setModalType] = useState('meeting'); // 'meeting' | 'event' | 'attendance'
   const [modalMode, setModalMode] = useState('add');     // 'add' | 'edit'
   const [currentItemId, setCurrentItemId] = useState(null);
   const [formData, setFormData] = useState({});
   const [attendanceData, setAttendanceData] = useState([]);
   const [attendanceSearch, setAttendanceSearch] = useState('');
   const [saving, setSaving] = useState(false);

   useEffect(() => {
      const fetchData = async () => {
         try {
            const shakhaRes = await api.get(`/shakhas/${id}`);
            setShakha(shakhaRes.data);

            const [meetingRes, eventRes] = await Promise.all([
               api.get('/meetings'),
               api.get('/events')
            ]);

            setMeetings(meetingRes.data.filter(m => m.shakhaId?._id === id || m.shakhaId === id || m.targetValue === id || (m.shakhas && m.shakhas.some(s => s._id === id || s === id))));
            setEvents(eventRes.data.filter(e => e.shakhaId?._id === id || e.shakhaId === id || e.targetValue === id || (e.shakhas && e.shakhas.some(s => s._id === id || s === id))));

            if (isAuthorizedToViewMembers) {
               try {
                  const membersRes = await api.get('/users');
                  // Always filter by the currently-viewed Shakha ID
                  setMembers(membersRes.data.filter(u => u.shakha?._id === id || u.shakha === id));
               } catch (e) {
                  console.error("Failed to load shakha members", e);
               }
            }

            // Resolve own Shakha for managers
            if (isManager) {
               try {
                  const profileRes = await api.get('/users/me');
                  setUserProfile(profileRes.data);
                  const assignedId = typeof profileRes.data.shakha === 'object'
                     ? profileRes.data.shakha?._id
                     : profileRes.data.shakha;
                  setIsOwnShakha(assignedId === id);
               } catch (e) {
                  console.error("Failed to load user profile", e);
               }
            }

         } catch (error) {
            console.error('Error fetching details', error);
         } finally {
            setLoading(false);
         }
      };
      fetchData();
   // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [id]);

   // --- Reload just meetings & events (after add/edit/delete) ---
   const refreshMeetingsAndEvents = async () => {
      try {
         const [meetingRes, eventRes] = await Promise.all([
            api.get('/meetings'),
            api.get('/events')
         ]);
         setMeetings(meetingRes.data.filter(m => m.shakhaId?._id === id || m.shakhaId === id || m.targetValue === id || (m.shakhas && m.shakhas.some(s => s._id === id || s === id))));
         setEvents(eventRes.data.filter(e => e.shakhaId?._id === id || e.shakhaId === id || e.targetValue === id || (e.shakhas && e.shakhas.some(s => s._id === id || s === id))));
      } catch (e) {
         console.error('Failed to refresh', e);
      }
   };

   // --- Modal helpers ---
   const openModal = async (type, mode, item = null) => {
      setModalType(type);
      setModalMode(mode);
      setCurrentItemId(item ? item._id : null);
      setFormData(mode === 'edit' && item ? { ...item } : {});
      setAttendanceData([]);
      setAttendanceSearch('');

      if (type === 'attendance' && item) {
         try {
            const res = await api.get(`/attendance/${item._id}`);
            setAttendanceData(res.data.records || []);
         } catch {
            toast.error('Failed to load attendance data');
            return;
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
      setFormData(prev => ({ ...prev, [name]: value }));
   };

   const handleSubmit = async (e) => {
      e.preventDefault();
      setSaving(true);
      try {
         const shakhaId = id; // always scope to the currently-viewed (own) Shakha

         if (modalType === 'attendance') {
            await api.put(`/attendance/${currentItemId}`, { records: attendanceData });
            toast.success('Attendance saved successfully');
            closeModal();
            await refreshMeetingsAndEvents();
            return;
         }

         const endpoint = modalType === 'meeting' ? '/meetings' : '/events';
         const submitData = {
            ...formData,
            shakhas: [shakhaId],
            targetType: 'shakha',
            targetValue: shakhaId,
         };

         if (modalMode === 'add') {
            await api.post(endpoint, submitData);
            toast.success(`${modalType === 'meeting' ? 'Meeting' : 'Event'} created successfully`);
         } else {
            await api.put(`${endpoint}/${currentItemId}`, submitData);
            toast.success(`${modalType === 'meeting' ? 'Meeting' : 'Event'} updated successfully`);
         }

         closeModal();
         await refreshMeetingsAndEvents();
      } catch (error) {
         toast.error(error.response?.data?.message || 'Failed to save. Please try again.');
      } finally {
         setSaving(false);
      }
   };

   const deleteItem = async (type, itemId) => {
      if (!window.confirm(`Are you sure you want to delete this ${type}?`)) return;
      try {
         await api.delete(`/${type}/${itemId}`);
         toast.success('Deleted successfully');
         await refreshMeetingsAndEvents();
      } catch (error) {
         toast.error(error.response?.data?.message || 'Failed to delete');
      }
   };

   // Whether this user can manage (edit/delete/add) items on this page
   const canManage = isManager && isOwnShakha;

   if (loading) return <div className="text-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-saffron-600 mx-auto"></div></div>;
   if (!shakha) return <div className="text-center py-20">Shakha not found.</div>;

   return (
      <div className="bg-[#fcfbf9] min-h-screen pt-4 pb-24 font-sans text-gray-800">
         <div className="max-w-3xl mx-auto px-5 sm:px-6 space-y-10">

            {/* Navigation */}
            <div className="pt-2">
               <Link to="/shakhas" className="inline-flex items-center text-[15px] font-medium text-gray-500 hover:text-[#e65c00] transition-colors">
                  <ChevronLeft className="w-5 h-5 mr-1 -ml-1" /> Back to Shakhas
               </Link>
            </div>

            {/* 1. Header Section */}
            <div className="space-y-4">
               <div className="flex flex-wrap items-start justify-between gap-4">
                  <h1 className="text-[36px] md:text-[44px] font-extrabold text-gray-900 leading-tight tracking-tight">
                     {shakha.name}
                  </h1>
                  {/* Management Quick Actions — only for managers of this Shakha */}
                  {canManage && (
                     <div className="flex gap-2 flex-wrap">
                        <button
                           onClick={() => openModal('meeting', 'add')}
                           className="flex items-center gap-1.5 bg-[#e65c00] text-white px-4 py-2 rounded-xl text-[13px] font-bold shadow-sm hover:bg-[#cc5200] active:scale-95 transition-all"
                        >
                           <Plus className="w-4 h-4" /> Meeting
                        </button>
                        <button
                           onClick={() => openModal('event', 'add')}
                           className="flex items-center gap-1.5 bg-white text-[#e65c00] border border-[#e65c00] px-4 py-2 rounded-xl text-[13px] font-bold hover:bg-orange-50 active:scale-95 transition-all"
                        >
                           <Plus className="w-4 h-4" /> Event
                        </button>
                     </div>
                  )}
               </div>
               <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-[15px] text-gray-600 font-medium">
                  <div className="flex items-center">
                     <MapPin className="w-5 h-5 text-[#e65c00] mr-2 shrink-0" />
                     {shakha.location}
                  </div>
                  <div className="flex items-center">
                     <Clock className="w-5 h-5 text-[#e65c00] mr-2 shrink-0" />
                     {shakha.time || "7:30 to 8:30 PM"}
                  </div>
               </div>
            </div>

            {/* 2. Leadership Section */}
            {(shakha.karyavah?.name || shakha.mukhyaShikshak?.name) && (
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {shakha.karyavah?.name && (
                     <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center">
                        <div className="w-12 h-12 rounded-full bg-[#ffefe3] flex items-center justify-center text-[#e65c00] shrink-0 mr-4">
                           <UserCircle2 className="w-6 h-6" />
                        </div>
                        <div>
                           <p className="text-[12px] font-bold text-[#e65c00] uppercase tracking-wider mb-0.5">Karyavah</p>
                           <p className="text-[16px] font-bold text-gray-900 leading-tight mb-0.5">{shakha.karyavah.name}</p>
                           {shakha.karyavah.contact && (
                              <div className="flex items-center text-[13px] text-gray-500 mt-1">
                                 <Phone className="w-3.5 h-3.5 mr-1.5" /> {shakha.karyavah.contact}
                              </div>
                           )}
                        </div>
                     </div>
                  )}

                  {shakha.mukhyaShikshak?.name && (
                     <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center">
                        <div className="w-12 h-12 rounded-full bg-[#ffefe3] flex items-center justify-center text-[#e65c00] shrink-0 mr-4">
                           <UserCircle2 className="w-6 h-6" />
                        </div>
                        <div>
                           <p className="text-[12px] font-bold text-[#e65c00] uppercase tracking-wider mb-0.5">Mukhya Shikshak</p>
                           <p className="text-[16px] font-bold text-gray-900 leading-tight mb-0.5">{shakha.mukhyaShikshak.name}</p>
                           {shakha.mukhyaShikshak.contact && (
                              <div className="flex items-center text-[13px] text-gray-500 mt-1">
                                 <Phone className="w-3.5 h-3.5 mr-1.5" /> {shakha.mukhyaShikshak.contact}
                              </div>
                           )}
                        </div>
                     </div>
                  )}
               </div>
            )}

            {/* 3. Description Section */}
            {shakha.description && (
               <div className="bg-white rounded-3xl p-6 md:p-8 border border-gray-100 shadow-sm">
                  <h3 className="text-[18px] font-bold text-gray-900 mb-4 tracking-tight">{t('description')}</h3>
                  <p className="text-[16px] text-gray-600 leading-relaxed whitespace-pre-line">
                     {shakha.description}
                  </p>
               </div>
            )}

            {/* 4. Members Section */}
            {isAuthorizedToViewMembers && (
               <div className="space-y-5">
                  <h2 className="text-[22px] font-extrabold text-gray-900 tracking-tight px-1">Swayamsevaks (Members) ({members.length})</h2>
                  {members.length > 0 ? (
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {members.map(m => (
                           <div key={m._id} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-saffron-50 text-[#e65c00] flex items-center justify-center font-bold">
                                 {m.name.charAt(0).toUpperCase()}
                               </div>
                               <div className="min-w-0 flex-1">
                                  <p className="font-bold text-gray-900 text-sm truncate">{m.name}</p>
                                  <p className="text-xs text-gray-500 truncate">{m.phone || m.email || 'No contact info'}</p>
                               </div>
                            </div>
                         ))}
                      </div>
                   ) : (
                      <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm text-center">
                         <p className="text-[15px] font-bold text-gray-600">No Swayamsevaks registered in this Shakha</p>
                      </div>
                   )}
               </div>
            )}

            {/* 5. Meetings Section */}
            <div className="space-y-5">
               <h2 className="text-[22px] font-extrabold text-gray-900 tracking-tight px-1">{t('meetings')}</h2>
               {meetings.length > 0 ? (
                  <div className="space-y-4">
                     {meetings.map((meeting) => (
                        <div key={meeting._id} className="bg-white rounded-2xl p-5 md:p-6 border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                           <div>
                              <h4 className="font-bold text-gray-900 text-[17px] mb-2">{meeting.displayTitle || meeting.title || 'Nagar Baithak'}</h4>
                              <div className="flex items-center text-gray-600 text-[14px] font-medium">
                                 <MapPin className="w-4 h-4 text-[#e65c00] mr-2 shrink-0" />
                                 {meeting.location}
                              </div>
                           </div>
                           <div className="flex flex-row md:flex-col items-center md:items-end gap-4 md:gap-1">
                              <div className="flex flex-row md:flex-col gap-5 md:gap-1 text-[14px] text-gray-600 font-medium md:text-right bg-gray-50 md:bg-transparent p-3 md:p-0 rounded-xl flex-1 md:flex-none">
                                 <div className="flex items-center md:justify-end">
                                    <Calendar className="w-4 h-4 text-[#e65c00] mr-2 md:hidden shrink-0" />
                                    {formatDateToDDMMYYYY(meeting.date)}
                                 </div>
                                 <div className="flex items-center md:justify-end">
                                    <Clock className="w-4 h-4 text-[#e65c00] mr-2 md:hidden shrink-0" />
                                    {meeting.time}
                                 </div>
                              </div>
                              {/* Management buttons — only for managers of this Shakha */}
                              {canManage && (
                                 <div className="flex gap-2 shrink-0">
                                    <button
                                       onClick={() => openModal('attendance', 'edit', meeting)}
                                       title="Mark Attendance"
                                       className="p-2 bg-orange-50 text-[#e65c00] rounded-lg hover:bg-orange-100 transition active:scale-95"
                                    >
                                       <ClipboardCheck className="w-4 h-4" />
                                    </button>
                                    <button
                                       onClick={() => openModal('meeting', 'edit', meeting)}
                                       title="Edit Meeting"
                                       className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition active:scale-95"
                                    >
                                       <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button
                                       onClick={() => deleteItem('meetings', meeting._id)}
                                       title="Delete Meeting"
                                       className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition active:scale-95"
                                    >
                                       <Trash2 className="w-4 h-4" />
                                    </button>
                                 </div>
                              )}
                           </div>
                        </div>
                     ))}
                  </div>
               ) : (
                  <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm text-center">
                     <p className="text-[15px] font-bold text-gray-600">No scheduled meetings</p>
                     <p className="text-[14px] text-gray-400 mt-1">Updates will appear here</p>
                  </div>
               )}
            </div>

            {/* 6. Events Section */}
            <div className="space-y-5">
               <h2 className="text-[22px] font-extrabold text-gray-900 tracking-tight px-1">{t('upcoming_events')}</h2>
               {events.length > 0 ? (
                  <div className="space-y-4">
                     {events.map((event) => (
                        <div key={event._id} className="bg-white rounded-2xl p-5 md:p-6 border border-gray-100 shadow-sm relative overflow-hidden">
                           <div className="absolute top-0 left-0 w-1.5 h-full bg-[#e65c00]"></div>
                           <div className="pl-3">
                              <div className="flex items-start justify-between gap-3">
                                 <h3 className="font-bold text-gray-900 text-[17px] mb-2">{event.title}</h3>
                                 {/* Management buttons for events */}
                                 {canManage && (
                                    <div className="flex gap-2 shrink-0">
                                       <button
                                          onClick={() => openModal('event', 'edit', event)}
                                          title="Edit Event"
                                          className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition active:scale-95"
                                       >
                                          <Edit2 className="w-4 h-4" />
                                       </button>
                                       <button
                                          onClick={() => deleteItem('events', event._id)}
                                          title="Delete Event"
                                          className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition active:scale-95"
                                       >
                                          <Trash2 className="w-4 h-4" />
                                       </button>
                                    </div>
                                 )}
                              </div>
                              <div className="flex flex-wrap gap-x-5 gap-y-2 text-[14px] text-gray-600 font-medium mb-3">
                                 <div className="flex items-center">
                                    <Calendar className="w-4 h-4 text-[#e65c00] mr-2 shrink-0" />
                                    {formatDateToDDMMYYYY(event.date)}
                                 </div>
                                 {event.time && (
                                    <div className="flex items-center">
                                       <Clock className="w-4 h-4 text-[#e65c00] mr-2 shrink-0" />
                                       {event.time}
                                    </div>
                                 )}
                              </div>
                              {event.description && (
                                 <p className="text-[15px] text-gray-600 leading-relaxed mt-4 pt-4 border-t border-gray-50">
                                    {event.description}
                                 </p>
                              )}
                           </div>
                        </div>
                     ))}
                  </div>
               ) : (
                  <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm text-center">
                     <p className="text-[15px] font-bold text-gray-600">No upcoming events</p>
                     <p className="text-[14px] text-gray-400 mt-1">Updates will appear here</p>
                  </div>
               )}
            </div>

         </div>

         {/* Management Modal — rendered at page root so it overlays correctly */}
         {isModalOpen && canManage && (
            <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4">
               <div className="bg-white rounded-[28px] p-6 md:p-8 max-w-lg w-full shadow-2xl relative max-h-[90vh] overflow-y-auto">
                  <button
                     onClick={closeModal}
                     className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-full transition"
                  >
                     <X className="w-5 h-5" />
                  </button>

                  <h3 className="text-[22px] font-black text-gray-900 mb-6 capitalize">
                     {modalType === 'attendance'
                        ? 'Mark Attendance'
                        : `${modalMode === 'add' ? 'Add' : 'Edit'} ${modalType === 'meeting' ? 'Meeting' : 'Event'}`
                     }
                  </h3>

                  <form onSubmit={handleSubmit} className="space-y-5">
                     {modalType === 'attendance' ? (
                        <div className="space-y-4">
                           {/* Search */}
                           <div className="relative">
                              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                              <input
                                 type="text"
                                 placeholder="Search members..."
                                 value={attendanceSearch}
                                 onChange={(e) => setAttendanceSearch(e.target.value)}
                                 className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#e65c00] outline-none"
                              />
                           </div>
                           {/* Bulk actions */}
                           <div className="flex gap-2">
                              <button type="button" onClick={() => setAttendanceData(prev => prev.map(r => ({ ...r, status: 'present' })))} className="flex-1 bg-green-50 text-green-700 hover:bg-green-100 py-2 rounded-xl text-sm font-bold transition">All Present</button>
                              <button type="button" onClick={() => setAttendanceData(prev => prev.map(r => ({ ...r, status: 'absent' })))} className="flex-1 bg-red-50 text-red-700 hover:bg-red-100 py-2 rounded-xl text-sm font-bold transition">All Absent</button>
                           </div>
                           {/* Member list */}
                           <div className="border border-gray-200 rounded-2xl divide-y divide-gray-100 overflow-y-auto max-h-60 bg-white">
                              {attendanceData.filter(r => r.user?.name?.toLowerCase().includes(attendanceSearch.toLowerCase())).length === 0 ? (
                                 <p className="text-center py-6 text-sm text-gray-500">No members found.</p>
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
                                          onClick={() => setAttendanceData(prev => prev.map(r =>
                                             r.user?._id === record.user?._id ? { ...r, status: r.status === 'present' ? 'absent' : 'present' } : r
                                          ))}
                                          className={`flex items-center px-3 py-1.5 rounded-lg text-xs font-bold transition ${record.status === 'present' ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-100 text-red-700 hover:bg-red-200'}`}
                                       >
                                          {record.status === 'present' ? <><CheckCircle className="w-3.5 h-3.5 mr-1" /> Present</> : <><XCircle className="w-3.5 h-3.5 mr-1" /> Absent</>}
                                       </button>
                                    </div>
                                 ))
                              }
                           </div>
                        </div>
                     ) : modalType === 'meeting' ? (
                        <div className="space-y-4">
                           <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Meeting Date</label>
                              <input type="date" required name="date" value={formData.date ? formData.date.split('T')[0] : ''} onChange={handleInputChange} className="w-full border border-gray-200 bg-gray-50 rounded-xl p-3 text-sm focus:ring-2 focus:ring-[#e65c00] outline-none focus:bg-white transition-colors" />
                           </div>
                           <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Time</label>
                              <input type="time" required name="time" value={formData.time || ''} onChange={handleInputChange} className="w-full border border-gray-200 bg-gray-50 rounded-xl p-3 text-sm focus:ring-2 focus:ring-[#e65c00] outline-none focus:bg-white transition-colors" />
                           </div>
                           <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Location</label>
                              <input type="text" required name="location" value={formData.location || ''} onChange={handleInputChange} placeholder="e.g. Shakha Grounds" className="w-full border border-gray-200 bg-gray-50 rounded-xl p-3 text-sm focus:ring-2 focus:ring-[#e65c00] outline-none focus:bg-white transition-colors" />
                           </div>
                        </div>
                     ) : (
                        <div className="space-y-4">
                           <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Event Title</label>
                              <input type="text" required name="title" value={formData.title || ''} onChange={handleInputChange} placeholder="e.g. Guru Puja" className="w-full border border-gray-200 bg-gray-50 rounded-xl p-3 text-sm focus:ring-2 focus:ring-[#e65c00] outline-none focus:bg-white transition-colors" />
                           </div>
                           <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Event Date</label>
                              <input type="date" required name="date" value={formData.date ? formData.date.split('T')[0] : ''} onChange={handleInputChange} className="w-full border border-gray-200 bg-gray-50 rounded-xl p-3 text-sm focus:ring-2 focus:ring-[#e65c00] outline-none focus:bg-white transition-colors" />
                           </div>
                           <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Time (Optional)</label>
                              <input type="time" name="time" value={formData.time || ''} onChange={handleInputChange} className="w-full border border-gray-200 bg-gray-50 rounded-xl p-3 text-sm focus:ring-2 focus:ring-[#e65c00] outline-none focus:bg-white transition-colors" />
                           </div>
                           <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Location (Optional)</label>
                              <input type="text" name="location" value={formData.location || ''} onChange={handleInputChange} placeholder="e.g. Community Hall" className="w-full border border-gray-200 bg-gray-50 rounded-xl p-3 text-sm focus:ring-2 focus:ring-[#e65c00] outline-none focus:bg-white transition-colors" />
                           </div>
                           <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Description</label>
                              <textarea name="description" value={formData.description || ''} onChange={handleInputChange} rows="3" placeholder="Event details..." className="w-full border border-gray-200 bg-gray-50 rounded-xl p-3 text-sm focus:ring-2 focus:ring-[#e65c00] outline-none focus:bg-white transition-colors resize-none" />
                           </div>
                        </div>
                     )}

                     <div className="flex gap-3 pt-2">
                        <button type="button" onClick={closeModal} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3.5 rounded-2xl font-bold text-sm transition">
                           Cancel
                        </button>
                        <button type="submit" disabled={saving} className="flex-1 bg-[#e65c00] hover:bg-[#cc5200] disabled:opacity-60 text-white py-3.5 rounded-2xl font-bold text-sm shadow-md transition">
                           {saving ? 'Saving...' : 'Save'}
                        </button>
                     </div>
                  </form>
               </div>
            </div>
         )}
      </div>
   );
};

export default ShakhaDetail;
