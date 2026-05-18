import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronRight, Bell, CalendarIcon, Loader2 } from 'lucide-react';
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
      <div className="relative z-20 px-5 space-y-10 flex flex-col items-center w-full mt-10">
        
        {/* Upcoming Meeting - Match Reference Image Exactly */}
        <div className="w-full max-w-md">
          <div className="flex justify-between items-center mb-4 px-1">
            <h3 className="font-extrabold text-gray-900 text-[19px] flex items-center tracking-tight">
               Upcoming Meeting
            </h3>
            {upcomingMeetings.length > 1 && (
              <span className="text-[14px] text-[#e65c00] font-bold cursor-pointer hover:underline" onClick={() => navigate('/meetings')}>View All</span>
            )}
          </div>
          
          {isLoading ? (
            <div className="w-full bg-white rounded-[24px] p-8 flex justify-center items-center shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-gray-100">
               <Loader2 className="w-8 h-8 text-[#e65c00] animate-spin" />
            </div>
          ) : nearestMeeting ? (
            <div className="w-full bg-white rounded-[28px] p-6 pb-5 shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-gray-100 cursor-pointer transition-transform" onClick={() => navigate('/meetings')}>
              <div className="flex items-start">
                {/* Circular Icon Container */}
                <div className="w-[52px] h-[52px] rounded-full bg-[#ffefe3] flex items-center justify-center shrink-0 mr-4">
                  <Bell className="w-6 h-6 text-[#e65c00]" fill="currentColor" strokeWidth={1} />
                </div>
                <div className="flex-1 min-w-0 mt-0.5">
                  <h4 className="font-bold text-gray-900 text-[20px] leading-tight mb-2 tracking-tight">{nearestMeeting.displayTitle || nearestMeeting.title || 'Nagar Baithak'}</h4>
                  <div className="text-[14px] text-gray-600 font-medium mb-1.5 opacity-90 overflow-hidden text-ellipsis">
                    {formatDate(nearestMeeting.date)} • {formatTime(nearestMeeting.time)}
                  </div>
                  <div className="text-[14px] text-gray-500 font-medium leading-snug break-words">
                      {nearestMeeting.location}
                  </div>
                </div>
              </div>
              
              <div className="w-full mt-6 pt-5 border-t border-gray-100 flex justify-between items-center">
                 <span className="bg-[#ffefe3] text-[#cc5200] text-[13px] font-bold px-4 py-2 rounded-[100px] flex items-center">
                    {(!nearestMeeting.shakhas || nearestMeeting.shakhas.length > 1) ? 'Nagar Level' : 'Shakha Level'}
                 </span>
                 <span className="text-[#e65c00] text-[14px] font-bold flex items-center active:scale-95 transition-transform hover:opacity-80 pt-1">
                   View Details →
                 </span>
              </div>
            </div>
          ) : (
             <div className="w-full bg-white rounded-[28px] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-gray-100 text-center flex flex-col items-center justify-center">
                <p className="text-[16px] font-bold text-gray-700 tracking-tight">No upcoming meetings</p>
                <p className="text-[14px] font-medium text-gray-400 mt-1">Check back later for updates</p>
             </div>
          )}
        </div>

        {/* Upcoming Event - Match Reference Structure Exactly */}
        <div className="w-full max-w-md">
          <div className="flex justify-between items-center mb-4 px-1">
            <h3 className="font-extrabold text-gray-900 text-[19px] flex items-center tracking-tight">
               Upcoming Event
            </h3>
            {upcomingEvents.length > 1 && (
              <span className="text-[14px] text-[#e65c00] font-bold cursor-pointer hover:underline" onClick={() => navigate('/events')}>View All</span>
            )}
          </div>
          
          {isLoading ? (
            <div className="w-full bg-white rounded-[24px] p-8 flex justify-center items-center shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-gray-100">
               <Loader2 className="w-8 h-8 text-[#e65c00] animate-spin" />
            </div>
          ) : nearestEvent ? (
            <div className="w-full bg-white rounded-[28px] p-6 pb-5 shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-gray-100 cursor-pointer transition-transform" onClick={() => navigate('/events')}>
               
               <div className="flex items-start">
                  {/* Circular Icon Container */}
                  <div className="w-[52px] h-[52px] rounded-full bg-[#ffefe3] flex items-center justify-center shrink-0 mr-4">
                     <CalendarIcon className="w-6 h-6 text-[#e65c00]" />
                  </div>
                  {/* Right Side Content */}
                  <div className="flex-1 min-w-0 mt-0.5">
                     <h4 className="font-bold text-gray-900 text-[19px] leading-tight mb-2 tracking-tight">{nearestEvent.title}</h4>
                     <div className="text-[14px] text-gray-600 font-medium mb-1.5 opacity-90 overflow-hidden text-ellipsis">
                        {formatDate(nearestEvent.date)} {nearestEvent.time && `• ${formatTime(nearestEvent.time)}`}
                     </div>
                     <div className="text-[14px] text-gray-500 font-medium leading-snug break-words">
                        {nearestEvent.location || getShakhaName(nearestEvent)}
                     </div>
                  </div>
               </div>
               
               <div className="w-full mt-6 pt-5 border-t border-gray-100 flex justify-end items-center">
                  <span className="text-[#e65c00] text-[14px] font-bold flex items-center active:scale-95 transition-transform hover:opacity-80 pt-1">
                    View Details →
                  </span>
               </div>
               
            </div>
          ) : (
             <div className="w-full bg-white rounded-[28px] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-gray-100 text-center flex flex-col items-center justify-center">
                <p className="text-[16px] font-bold text-gray-700 tracking-tight">No upcoming events</p>
                <p className="text-[14px] font-medium text-gray-400 mt-1">Check back later for schedule updates</p>
             </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default Home;
