import { NavLink } from 'react-router-dom';
import { Home, MapPin, Calendar, CheckSquare, ClipboardCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const BottomNav = () => {
  const navItems = [
    { to: '/home', icon: Home, label: 'Home' },
    { to: '/shakhas', icon: MapPin, label: 'Shakhas' },
    { to: '/meetings', icon: Calendar, label: 'Meetings' },
    { to: '/events', icon: CheckSquare, label: 'Events' },
    { to: '/attendance', icon: ClipboardCheck, label: 'Attend' },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 w-full bg-white shadow-[0_-5px_25px_rgba(0,0,0,0.08)] border-t border-gray-100 z-50">
      <div className="flex justify-around items-center h-16 pb-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className="flex flex-col items-center justify-center w-full h-full text-[11px] font-semibold transition-all pt-1"
          >
            {({ isActive }) => {
              const Icon = item.icon;
              return (
                <>
                  <Icon 
                    className={`w-6 h-6 mb-1 transition-all ${isActive ? 'text-[#f26500] scale-110' : 'text-gray-400'}`} 
                    fill={isActive ? 'currentColor' : 'none'} 
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                  <span className={`${isActive ? 'text-[#f26500]' : 'text-gray-400'}`}>
                    {item.label}
                  </span>
                </>
              );
            }}
          </NavLink>
        ))}
      </div>
    </div>
  );
};

export default BottomNav;
