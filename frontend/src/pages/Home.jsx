import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronRight, Bell, CalendarIcon, Loader2, Clock, MapPin } from 'lucide-react';
import api from '../utils/api';
import { formatDateToDDMMYYYY } from '../utils/dateUtils';

const Home = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [upcomingMeetings, setUpcomingMeetings] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      try {
        const [meetingsRes, eventsRes] = await Promise.all([
          api.get('/meetings'),
          api.get('/events')
        ]);
        
        if (!isMounted) return;

        const now = new Date();
        now.setHours(0, 0, 0, 0);
        
        const futureMeetings = meetingsRes.data.filter(m => new Date(m.date) >= now);
        futureMeetings.sort((a, b) => new Date(a.date) - new Date(b.date));
        setUpcomingMeetings(futureMeetings);

        const futureEvents = eventsRes.data.filter(e => new Date(e.date) >= now);
        futureEvents.sort((a, b) => new Date(a.date) - new Date(b.date));
        setUpcomingEvents(futureEvents);
        
      } catch (error) {
        console.error("Error fetching dashboard data", error);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    fetchData();
    return () => { isMounted = false; };
  }, []);

  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    try {
      const [h, m] = timeStr.split(':');
      let hour = parseInt(h);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      hour = hour % 12 || 12;
      return `${hour}:${m} ${ampm}`;
    } catch {
      return timeStr;
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const isToday = new Date().toDateString() === d.toDateString();
    if (isToday) return 'Today';
    return formatDateToDDMMYYYY(dateStr);
  };
  
  const getShakhaName = (item) => {
    if (!item?.shakhas || item.shakhas.length === 0) return 'Nagar Level';
    if (item.shakhas.length > 1) return 'Multiple Shakhas';
    return item.shakhas[0].name;
  };

  const nearestMeeting = upcomingMeetings[0];
  const nearestEvent = upcomingEvents[0];

  return (
    <div className="bg-[#faf8f5] min-h-screen pb-10 overflow-x-hidden">
      {/* Centered Premium Orange Hero - Restored to smooth curved edge */}
      <div className="bg-[#e65c00] text-white pt-[100px] pb-16 px-6 w-full rounded-b-[40px] shadow-[0_8px_30px_rgba(230,92,0,0.12)] relative overflow-hidden flex flex-col items-center text-center">
        {/* Abstract background curves/shapes */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-white opacity-5 rounded-full blur-2xl -ml-10 -mb-10 pointer-events-none"></div>
        
        <div className="relative z-10 w-full max-w-sm">
          <h1 className="text-[34px] md:text-[38px] font-extrabold tracking-tight mb-3 leading-tight">Sardar Nagar<br />RSS</h1>
          <p className="text-[15px] font-medium opacity-90 leading-relaxed mb-8 mx-auto px-2 max-w-[280px]">
            Empowering youth and building character for a stronger nation.
          </p>
          
          <div className="grid grid-cols-2 gap-4 items-center w-full max-w-[320px] mx-auto">
             <Link to="/join" className="w-full bg-white text-[#e65c00] text-center py-3.5 rounded-2xl font-bold shadow-md hover:shadow-lg active:scale-[0.98] transition-all text-[15px]">
               Join RSS
             </Link>
             <Link to="/shakhas" className="w-full bg-transparent border-[1.5px] border-white/70 text-white text-center py-3.5 rounded-2xl font-bold active:scale-[0.98] transition-all text-[15px] flex items-center justify-center hover:bg-white/10">
               View All Shakhas
             </Link>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="relative z-20 px-5 space-y-8 flex flex-col items-center w-full mt-8">
        
        {/* Upcoming Meeting */}
        <div className="w-full max-w-md">
          <div className="flex justify-between items-end mb-4 px-1">
            <h3 className="font-extrabold text-gray-900 text-[18px] tracking-tight">
               Upcoming Meeting
            </h3>
            {upcomingMeetings.length > 1 && (
              <span className="text-[13px] text-[#e65c00] font-bold cursor-pointer hover:opacity-80 transition-opacity" onClick={() => navigate('/meetings')}>View All</span>
            )}
          </div>
          
          {isLoading ? (
            <div className="w-full bg-white rounded-3xl p-8 flex justify-center items-center shadow-[0_4px_24px_rgba(0,0,0,0.04)] border border-gray-50">
               <Loader2 className="w-8 h-8 text-[#e65c00] animate-spin" />
            </div>
          ) : nearestMeeting ? (
            <div className="group w-full bg-white rounded-3xl p-5 shadow-[0_4px_24px_rgba(0,0,0,0.04)] border border-gray-50 hover:shadow-[0_8px_32px_rgba(230,92,0,0.08)] cursor-pointer transition-all duration-300" onClick={() => navigate('/meetings')}>
              <div className="flex items-start gap-4">
                {/* Left Date/Time Badge */}
                <div className="flex flex-col items-center justify-center shrink-0 w-[60px] h-[68px] bg-gradient-to-b from-[#fff6f0] to-[#fff1e6] rounded-2xl border border-orange-100/50">
                  <span className="text-[#e65c00] text-[10px] font-extrabold uppercase tracking-widest mb-0.5">{new Date(nearestMeeting.date).toLocaleString('en-US', { month: 'short' })}</span>
                  <span className="text-[#cc5200] text-[22px] font-black leading-none">{new Date(nearestMeeting.date).getDate()}</span>
                </div>

                {/* Right Content */}
                <div className="flex-1 min-w-0 pt-0.5">
                  <h4 className="font-extrabold text-gray-900 text-[17px] leading-snug truncate pr-2 mb-1.5">
                    {nearestMeeting.displayTitle || nearestMeeting.title || 'Nagar Baithak'}
                  </h4>
                  
                  <div className="flex items-center text-gray-500 text-[13px] font-medium mb-1.5">
                    <Clock className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
                    {formatTime(nearestMeeting.time)}
                  </div>
                  
                  <div className="flex items-center text-gray-500 text-[13px] font-medium truncate pr-2">
                    <MapPin className="w-3.5 h-3.5 mr-1.5 text-gray-400 shrink-0" />
                    <span className="truncate">{nearestMeeting.location}</span>
                  </div>
                </div>
              </div>

              <div className="w-full mt-5 pt-4 border-t border-gray-50 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${(!nearestMeeting.shakhas || nearestMeeting.shakhas.length > 1) ? 'bg-[#e65c00]' : 'bg-emerald-500'}`}></div>
                  <span className="text-gray-600 text-[12px] font-bold tracking-wide uppercase">
                    {(!nearestMeeting.shakhas || nearestMeeting.shakhas.length > 1) ? 'Nagar Level' : 'Shakha Level'}
                  </span>
                </div>
                
                <div className="w-8 h-8 rounded-full bg-orange-50 group-hover:bg-[#e65c00] flex items-center justify-center transition-colors duration-300">
                  <ChevronRight className="w-4 h-4 text-[#e65c00] group-hover:text-white transition-colors duration-300" />
                </div>
              </div>
            </div>
          ) : (
             <div className="w-full bg-white/60 backdrop-blur-sm rounded-3xl p-8 shadow-[0_2px_20px_rgba(0,0,0,0.02)] border border-dashed border-gray-200 text-center flex flex-col items-center justify-center">
                <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center mb-3">
                  <Bell className="w-5 h-5 text-gray-400" />
                </div>
                <p className="text-[15px] font-bold text-gray-700 tracking-tight">No Upcoming Meetings</p>
                <p className="text-[13px] font-medium text-gray-500 mt-1">Check back later for updates</p>
             </div>
          )}
        </div>

        {/* Upcoming Event */}
        <div className="w-full max-w-md pb-6">
          <div className="flex justify-between items-end mb-4 px-1">
            <h3 className="font-extrabold text-gray-900 text-[18px] tracking-tight">
               Upcoming Event
            </h3>
            {upcomingEvents.length > 1 && (
              <span className="text-[13px] text-[#e65c00] font-bold cursor-pointer hover:opacity-80 transition-opacity" onClick={() => navigate('/events')}>View All</span>
            )}
          </div>
          
          {isLoading ? (
            <div className="w-full bg-white rounded-3xl p-8 flex justify-center items-center shadow-[0_4px_24px_rgba(0,0,0,0.04)] border border-gray-50">
               <Loader2 className="w-8 h-8 text-[#e65c00] animate-spin" />
            </div>
          ) : nearestEvent ? (
            <div className="group w-full bg-white rounded-3xl p-5 shadow-[0_4px_24px_rgba(0,0,0,0.04)] border border-gray-50 hover:shadow-[0_8px_32px_rgba(230,92,0,0.08)] cursor-pointer transition-all duration-300" onClick={() => navigate('/events')}>
               
               <div className="flex items-start gap-4">
                  {/* Left Date/Time Badge */}
                  <div className="flex flex-col items-center justify-center shrink-0 w-[60px] h-[68px] bg-gradient-to-b from-[#fff6f0] to-[#fff1e6] rounded-2xl border border-orange-100/50">
                    <span className="text-[#e65c00] text-[10px] font-extrabold uppercase tracking-widest mb-0.5">{new Date(nearestEvent.date).toLocaleString('en-US', { month: 'short' })}</span>
                    <span className="text-[#cc5200] text-[22px] font-black leading-none">{new Date(nearestEvent.date).getDate()}</span>
                  </div>

                  {/* Right Content */}
                  <div className="flex-1 min-w-0 pt-0.5">
                     <h4 className="font-extrabold text-gray-900 text-[17px] leading-snug truncate pr-2 mb-1.5">
                        {nearestEvent.title}
                     </h4>
                     
                     {nearestEvent.time && (
                       <div className="flex items-center text-gray-500 text-[13px] font-medium mb-1.5">
                         <Clock className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
                         {formatTime(nearestEvent.time)}
                       </div>
                     )}
                     
                     <div className="flex items-center text-gray-500 text-[13px] font-medium truncate pr-2">
                        <MapPin className="w-3.5 h-3.5 mr-1.5 text-gray-400 shrink-0" />
                        <span className="truncate">{nearestEvent.location || getShakhaName(nearestEvent)}</span>
                     </div>
                  </div>
               </div>
               
               <div className="w-full mt-5 pt-4 border-t border-gray-50 flex justify-end items-center">
                  <div className="w-8 h-8 rounded-full bg-orange-50 group-hover:bg-[#e65c00] flex items-center justify-center transition-colors duration-300">
                    <ChevronRight className="w-4 h-4 text-[#e65c00] group-hover:text-white transition-colors duration-300" />
                  </div>
               </div>
               
            </div>
          ) : (
             <div className="w-full bg-white/60 backdrop-blur-sm rounded-3xl p-8 shadow-[0_2px_20px_rgba(0,0,0,0.02)] border border-dashed border-gray-200 text-center flex flex-col items-center justify-center">
                <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center mb-3">
                  <CalendarIcon className="w-5 h-5 text-gray-400" />
                </div>
                <p className="text-[15px] font-bold text-gray-700 tracking-tight">No Upcoming Events</p>
                <p className="text-[13px] font-medium text-gray-500 mt-1">There are no events scheduled at this time.</p>
             </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default Home;
