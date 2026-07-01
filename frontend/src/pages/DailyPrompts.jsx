import { motion } from 'framer-motion';
import { HiOutlineSparkles } from 'react-icons/hi';

function DailyPrompts() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-4xl mx-auto h-full flex flex-col items-center justify-center min-h-[80vh]"
    >
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center p-3 bg-sky-100 text-sky-600 rounded-2xl mb-4">
          <HiOutlineSparkles className="text-3xl" />
        </div>
        <h1 className="text-3xl font-bold text-gray-800">Question of the Day</h1>
      </div>

      <motion.div 
        initial={{ y: 20, scale: 0.95 }}
        animate={{ y: 0, scale: 1 }}
        transition={{ delay: 0.2 }}
        className="w-full glass p-8 md:p-12 rounded-[2.5rem] shadow-lg relative overflow-hidden text-center border border-white"
      >
        <div className="absolute top-0 left-0 w-full h-3 bg-gradient-to-r from-blush-300 via-sky-300 to-blush-300"></div>
        
        <h2 className="text-2xl md:text-3xl font-semibold text-gray-800 mb-10 leading-relaxed">
          "What is a small detail about me that you absolutely love, but have never mentioned before?"
        </h2>

        <div className="space-y-6">
          {/* My Answer Box */}
          <div className="text-left">
            <label className="block text-sm font-medium text-gray-500 mb-2">Your Answer</label>
            <textarea 
              rows="4" 
              className="w-full p-4 rounded-2xl bg-white/60 border border-blush-100 focus:outline-none focus:ring-2 focus:ring-blush-400 focus:bg-white transition resize-none placeholder-gray-400"
              placeholder="Type your thoughtful answer here..."
            ></textarea>
          </div>

          <button className="w-full py-4 bg-blush-500 text-white font-bold rounded-2xl hover:bg-blush-600 transition shadow-md hover:shadow-lg transform hover:-translate-y-1">
            Lock Answer & Reveal
          </button>

          <p className="text-sm text-gray-400 italic mt-4">
            * You can only see your partner's answer after you submit yours!
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default DailyPrompts;
