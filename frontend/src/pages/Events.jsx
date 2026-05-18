import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { CalendarIcon, ChevronRight, Loader2, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { formatDateToDDMMYYYY } from '../utils/dateUtils';

const Events = () => {
  const { t } = useTranslation();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await api.get('/events');
        const sorted = res.data.sort((a, b) => new Date(a.date) - new Date(b.date));
        setEvents(sorted);
      } catch (error) {
        console.error('Failed to fetch events', error);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  const formatDate = (dateStr) => {
    return formatDateToDDMMYYYY(dateStr);
  };

  const getShakhaName = (item) => {
    if (!item?.shakhas || item.shakhas.length === 0) return 'Nagar Level';
    if (item.shakhas.length > 1) return 'Multiple Shakhas';
    return item.shakhas[0].name;
  };

  return (
    <div className="bg-[#faf8f5] min-h-screen pt-4 pb-12 overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 space-y-8">
        <h1 className="text-[36px] font-extrabold text-[#e65c00] tracking-tight text-center">{t('events')}</h1>
        
        {loading ? (
           <div className="flex justify-center items-center py-20">
             <Loader2 className="w-10 h-10 text-[#e65c00] animate-spin" />
          </div>
        ) : (
          <div className="flex justify-center w-full mt-4">
             <div className="w-full max-w-md flex flex-col gap-6">
                {events.map((event) => (
                   <div key={event._id} className="w-full bg-white rounded-[28px] p-6 pb-5 shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-gray-100 cursor-pointer transition-transform">
                      <div className="flex items-start">
                         {/* Circular Icon Container */}
                         <div className="w-[52px] h-[52px] rounded-full bg-[#ffefe3] flex items-center justify-center shrink-0 mr-4">
                           <CalendarIcon className="w-6 h-6 text-[#e65c00]" />
                         </div>
                         {/* Right Side Content */}
                         <div className="flex-1 min-w-0 mt-0.5">
                            <h4 className="font-bold text-gray-900 text-[19px] leading-tight mb-2 tracking-tight">{event.title}</h4>
                            <div className="text-[14px] text-gray-600 font-medium mb-1.5 opacity-90 overflow-hidden text-ellipsis">
                              {formatDate(event.date)}
                              {event.time && ` · ${event.time}`}
                            </div>
                            <div className="text-[14px] text-gray-500 font-medium leading-snug break-words">
                              {event.location || getShakhaName(event)}
                            </div>
                         </div>
                      </div>
                      
                      {event.description && (
                         <div className="mt-4 text-[14px] text-gray-600 line-clamp-2 leading-relaxed">
                            {event.description}
                         </div>
                      )}

                      <div className="w-full mt-6 pt-5 border-t border-gray-100 flex justify-end items-center">
                         <span className="text-[#e65c00] text-[14px] font-bold flex items-center active:scale-95 transition-transform hover:opacity-80 pt-1">
                           View Details →
                         </span>
                      </div>
                   </div>
                ))}
                {events.length === 0 && (
                   <div className="w-full bg-white rounded-[28px] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-gray-100 text-center flex flex-col items-center justify-center">
                     <p className="text-[16px] font-bold text-gray-700 tracking-tight">No upcoming events</p>
                     <p className="text-[14px] font-medium text-gray-400 mt-1">Check back later for schedule updates</p>
                   </div>
                )}
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Events;
