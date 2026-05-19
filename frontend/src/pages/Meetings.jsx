import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar, Clock, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { formatDateToDDMMYYYY } from '../utils/dateUtils';

const Meetings = () => {
  const { t } = useTranslation();
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMeetings = async () => {
      try {
        const res = await api.get('/meetings');
        const sorted = res.data.sort((a, b) => new Date(a.date) - new Date(b.date));
        setMeetings(sorted);
      } catch (error) {
        console.error('Failed to fetch meetings', error);
      } finally {
        setLoading(false);
      }
    };
    fetchMeetings();
  }, []);

  return (
    <div className="bg-[#faf8f5] min-h-screen pt-4 pb-12 overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold text-center text-[#e65c00] mb-10 pt-6">{t('meetings')}</h1>
        
        {loading ? (
          <div className="text-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#e65c00] mx-auto"></div></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {meetings.map((meeting) => {
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              const meetingDate = new Date(meeting.date);
              const status = meetingDate >= today ? 'Upcoming' : 'Completed';
              
              let level = 'Shakha Level';
              if (meeting.group || (meeting.groups && meeting.groups.length > 0)) level = 'Group Level';
              else if (!meeting.shakhas || meeting.shakhas.length !== 1) level = 'Nagar Level';

              return (
                <div key={meeting._id} className="relative bg-white rounded-[20px] shadow-[0_4px_24px_rgba(0,0,0,0.04)] border border-gray-50 hover:shadow-[0_8px_32px_rgba(230,92,0,0.08)] transition-all duration-300 flex flex-col overflow-hidden">
                  {/* Thin Orange Left Accent Border */}
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#e65c00]"></div>
                  
                  <div className="p-5 pl-6 flex-grow flex flex-col">
                    {/* Top Header: Title & Status Badge */}
                    <div className="flex justify-between items-start mb-3 gap-3">
                      <h3 className="font-extrabold text-gray-900 text-[18px] tracking-tight leading-snug">
                         {meeting.displayTitle || meeting.title || 'Nagar Baithak'}
                      </h3>
                      <span className={`shrink-0 px-3 py-1.5 rounded-full text-[11px] font-extrabold tracking-widest uppercase ${status === 'Upcoming' ? 'bg-[#ffefe3] text-[#cc5200]' : 'bg-gray-100 text-gray-500'}`}>
                        {status}
                      </span>
                    </div>

                    {/* Compact Date & Time Layout */}
                    <div className="flex flex-wrap items-center text-gray-600 text-[13px] font-bold mb-3.5 gap-x-3 gap-y-1">
                      <div className="flex items-center">
                        <span className="text-[16px] mr-1.5">📅</span>
                        <span>{formatDateToDDMMYYYY(meeting.date)}</span>
                      </div>
                      <div className="flex items-center">
                        <span className="text-[16px] mr-1.5">⏰</span>
                        <span>{meeting.time}</span>
                      </div>
                    </div>

                    {/* Location Handling */}
                    <div className="flex items-start text-gray-500 text-[14px] font-medium leading-relaxed mb-5">
                      <MapPin className="w-4 h-4 mr-2 mt-0.5 text-gray-400 shrink-0" />
                      <span className="line-clamp-2">{meeting.location}</span>
                    </div>

                    {/* Bottom Level Badge */}
                    <div className="mt-auto pt-4 border-t border-gray-50 flex items-center">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${level === 'Nagar Level' ? 'bg-[#e65c00]' : level === 'Group Level' ? 'bg-blue-500' : 'bg-emerald-500'}`}></div>
                        <span className="text-gray-600 text-[12px] font-bold tracking-wide uppercase">
                          {level}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Empty State Card at the bottom */}
            {meetings.length === 0 ? (
              <div className="col-span-1 md:col-span-2 lg:col-span-3">
                <div className="w-full bg-white/60 backdrop-blur-sm rounded-3xl p-10 shadow-[0_2px_20px_rgba(0,0,0,0.02)] border border-dashed border-gray-200 text-center flex flex-col items-center justify-center">
                  <div className="w-16 h-16 bg-gray-50 rounded-3xl flex items-center justify-center mb-4">
                    <Calendar className="w-7 h-7 text-gray-400" />
                  </div>
                  <p className="text-[18px] font-bold text-gray-700 tracking-tight">No meetings scheduled</p>
                  <p className="text-[14px] font-medium text-gray-500 mt-1">There are no meetings available at the moment.</p>
                </div>
              </div>
            ) : (
              <div className="col-span-1 md:col-span-2 lg:col-span-3 mt-4">
                <div className="w-full bg-white/60 backdrop-blur-sm rounded-3xl p-8 shadow-[0_2px_20px_rgba(0,0,0,0.02)] border border-dashed border-gray-200 text-center flex flex-col items-center justify-center">
                  <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center mb-3">
                    <Calendar className="w-5 h-5 text-gray-400" />
                  </div>
                  <p className="text-[15px] font-bold text-gray-700 tracking-tight">No more meetings</p>
                  <p className="text-[13px] font-medium text-gray-500 mt-1">You've reached the end of the schedule.</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Meetings;
