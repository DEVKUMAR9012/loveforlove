import { motion } from 'framer-motion';
import { HiOutlinePlus } from 'react-icons/hi';

function SharedCalendar() {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dates = Array.from({ length: 35 }, (_, i) => i - 2); // Sample month dates

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-5xl mx-auto h-full"
    >
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Calendar 🗓️</h1>
          <p className="text-gray-500">Counting the days until our next adventure.</p>
        </div>
        <button className="p-3 bg-sky-500 text-white rounded-full hover:bg-sky-600 transition shadow-sm">
          <HiOutlinePlus className="text-2xl" />
        </button>
      </div>

      <div className="glass p-6 md:p-8 rounded-[2rem] shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">October 2026</h2>
          <div className="flex gap-2">
            <button className="px-4 py-2 rounded-xl bg-white/50 hover:bg-white text-gray-600 transition">&lt;</button>
            <button className="px-4 py-2 rounded-xl bg-white/50 hover:bg-white text-gray-600 transition">&gt;</button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-2 md:gap-4 text-center mb-4">
          {days.map(day => (
            <div key={day} className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2 md:gap-4">
          {dates.map((date, i) => (
            <div 
              key={i} 
              className={`aspect-square flex flex-col items-center justify-center rounded-2xl transition cursor-pointer
                ${date > 0 && date <= 31 ? 'bg-white/40 hover:bg-white shadow-sm' : 'opacity-0 pointer-events-none'}
                ${date === 14 ? 'border-2 border-blush-400 bg-blush-50' : ''}
                ${date === 25 ? 'bg-sky-100 text-sky-700' : ''}
              `}
            >
              <span className={`text-lg ${date === 14 ? 'font-bold text-blush-600' : 'text-gray-700'}`}>
                {date > 0 && date <= 31 ? date : ''}
              </span>
              {date === 14 && <div className="w-1.5 h-1.5 rounded-full bg-blush-500 mt-1"></div>}
              {date === 25 && <div className="w-1.5 h-1.5 rounded-full bg-sky-500 mt-1"></div>}
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

export default SharedCalendar;
