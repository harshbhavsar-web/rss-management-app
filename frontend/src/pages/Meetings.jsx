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
            {meetings.map((meeting) => (
              <div key={meeting._id} className="bg-white rounded-xl shadow border-t-4 border-[#e65c00] hover:shadow-lg transition flex flex-col h-full">
                <div className="p-6 flex-grow">
                  
                  <h3 className="font-bold text-xl text-gray-800 mb-4 block tracking-tight">
                     {meeting.displayTitle || meeting.title || 'Nagar Baithak'}
                  </h3>

                  <div className="space-y-3">
                    <div className="flex items-center text-gray-600">
                      <Calendar className="w-5 h-5 mr-3 text-[#e65c00]" />
                      <span>{formatDateToDDMMYYYY(meeting.date)}</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <Clock className="w-5 h-5 mr-3 text-[#e65c00]" />
                      <span>{meeting.time}</span>
                    </div>
                    <div className="flex items-start text-gray-600">
                      <MapPin className="w-5 h-5 mr-3 text-[#e65c00] flex-shrink-0 mt-0.5" />
                      <span>{meeting.location}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          {meetings.length === 0 && (
            <div className="col-span-1 md:col-span-3 text-center text-gray-500 py-10">No meetings scheduled.</div>
          )}
        </div>
      )}
      </div>
    </div>
  );
};

export default Meetings;
