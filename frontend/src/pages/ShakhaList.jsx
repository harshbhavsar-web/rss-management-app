import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Search, MapPin, Loader2 } from 'lucide-react';
import api from '../utils/api';

const ShakhaList = () => {
  const { t } = useTranslation();
  const [shakhas, setShakhas] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchShakhas = async () => {
      try {
        const res = await api.get('/shakhas');
        setShakhas(res.data);
      } catch (error) {
        console.error('Failed to fetch shakhas', error);
      } finally {
        setLoading(false);
      }
    };
    fetchShakhas();
  }, []);

  const filteredShakhas = shakhas.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) || 
    s.location.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="bg-[#faf8f5] min-h-screen pt-4 pb-12 overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 space-y-8">
        
        {/* Title & Search Container */}
        <div className="flex flex-col gap-6 items-center w-full">
          <h1 className="text-[36px] font-extrabold text-[#e65c00] tracking-tight text-center">{t('shakhas')}</h1>
          
          <div className="relative w-full max-w-lg mt-2">
             <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
               <Search className="h-5 w-5 text-gray-400" />
             </div>
             <input 
               type="text" 
               placeholder="Search shakhas by name or location..."
               className="w-full pl-12 pr-4 py-4 border border-gray-100 rounded-[20px] bg-white text-[15px] focus:ring-2 focus:ring-[#e65c00] focus:border-transparent outline-none transition-all placeholder-gray-400 shadow-sm"
               value={search}
               onChange={(e) => setSearch(e.target.value)}
             />
          </div>
        </div>

        {/* Shakhas List */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
             <Loader2 className="w-10 h-10 text-[#e65c00] animate-spin" />
          </div>
        ) : (
          <div className="flex justify-center w-full">
            <div className="w-full max-w-lg flex flex-col gap-6">
               {filteredShakhas.map(shakha => (
                 <div key={shakha._id} className="w-full bg-white rounded-[28px] p-6 pb-5 shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-gray-100 transition-transform active:scale-[0.98] cursor-default flex flex-col">
                    
                     {/* Top: Title */}
                    <h2 className="text-[22px] md:text-[24px] font-black text-gray-900 leading-tight mb-5 tracking-tight">
                       {shakha.name}
                    </h2>

                    {/* Middle: Location & Description */}
                    <div className="flex items-start mb-6">
                       <MapPin className="w-5 h-5 text-[#e65c00] mt-0.5 shrink-0 mr-3" />
                       <div className="flex-1">
                          <p className="text-[15px] text-gray-600 line-clamp-3 leading-relaxed">
                            {shakha.description ? shakha.description + " — " : ""}
                            {shakha.location}
                          </p>
                       </div>
                    </div>
                    
                    {/* Time Slot Mock - or actual if DB maps it eventually */}
                    <div className="text-[14px] text-gray-500 font-medium mb-3">
                       Time : {shakha.time || "7:30 to 8:30 PM"}
                    </div>


                    {/* Bottom: Button */}
                    <div className="w-full pt-5 border-t border-gray-100 flex justify-end items-center">
                       <Link to={`/shakhas/${shakha._id}`} className="text-[#e65c00] text-[15.5px] font-bold flex items-center active:scale-95 transition-transform hover:opacity-80 pt-1">
                         View Details →
                       </Link>
                    </div>

                 </div>
               ))}

               {filteredShakhas.length === 0 && (
                 <div className="text-center bg-white rounded-[28px] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-gray-100 w-full flex flex-col items-center justify-center mt-5">
                    <p className="text-[16px] font-bold text-gray-700 tracking-tight">No shakhas found</p>
                    <p className="text-[14px] font-medium text-gray-400 mt-1.5">Try adjusting your search criteria</p>
                 </div>
               )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShakhaList;
