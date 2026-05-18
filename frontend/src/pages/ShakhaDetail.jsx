import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MapPin, Phone, Calendar, Clock, ChevronLeft, UserCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { formatDateToDDMMYYYY } from '../utils/dateUtils';


const ShakhaDetail = () => {
  const { id } = useParams();
  const { t } = useTranslation();
  const [shakha, setShakha] = useState(null);
  const [meetings, setMeetings] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const shakhaRes = await api.get(`/shakhas/${id}`);
        setShakha(shakhaRes.data);

        // Fetch meetings and events, then filter for this shakha
        // In a real production app, we would have specific backend endpoints
        // like /api/shakhas/:id/meetings, but for this demo filtering locally works.
        const [meetingRes, eventRes] = await Promise.all([
          api.get('/meetings'),
          api.get('/events')
        ]);
        
        setMeetings(meetingRes.data.filter(m => m.shakhaId?._id === id || m.shakhaId === id));
        setEvents(eventRes.data.filter(e => e.shakhaId?._id === id || e.shakhaId === id));

      } catch (error) {
        console.error('Error fetching details', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

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
           <h1 className="text-[36px] md:text-[44px] font-extrabold text-gray-900 leading-tight tracking-tight">
              {shakha.name}
           </h1>
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
        {(shakha.karyavah?.name || shakha.mukhyaShikshak?.name || shakha.contact) && (
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

              {shakha.contact && !shakha.karyavah?.contact && !shakha.mukhyaShikshak?.contact && (
                 <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center sm:col-span-2">
                    <div className="w-12 h-12 rounded-full bg-[#ffefe3] flex items-center justify-center text-[#e65c00] shrink-0 mr-4">
                       <Phone className="w-5 h-5" />
                    </div>
                    <div>
                       <p className="text-[12px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">General Contact</p>
                       <p className="text-[16px] font-bold text-gray-900">{shakha.contact}</p>
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

        {/* 4. Meetings Section */}
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
                       <div className="flex flex-row md:flex-col gap-5 md:gap-1 text-[14px] text-gray-600 font-medium md:text-right bg-gray-50 md:bg-transparent p-3 md:p-0 rounded-xl">
                          <div className="flex items-center md:justify-end">
                             <Calendar className="w-4 h-4 text-[#e65c00] mr-2 md:hidden shrink-0" /> 
                             {formatDateToDDMMYYYY(meeting.date)}
                          </div>
                          <div className="flex items-center md:justify-end">
                             <Clock className="w-4 h-4 text-[#e65c00] mr-2 md:hidden shrink-0" /> 
                             {meeting.time}
                          </div>
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

        {/* 5. Events Section */}
        <div className="space-y-5">
           <h2 className="text-[22px] font-extrabold text-gray-900 tracking-tight px-1">{t('upcoming_events')}</h2>
           {events.length > 0 ? (
              <div className="space-y-4">
                 {events.map((event) => (
                    <div key={event._id} className="bg-white rounded-2xl p-5 md:p-6 border border-gray-100 shadow-sm relative overflow-hidden">
                       <div className="absolute top-0 left-0 w-1.5 h-full bg-[#e65c00]"></div>
                       <div className="pl-3">
                          <h3 className="font-bold text-gray-900 text-[17px] mb-2">{event.title}</h3>
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
    </div>
  );
};

export default ShakhaDetail;
