import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  HiOutlineSupport,
  HiOutlineLightBulb,
  HiOutlineFlag,
  HiOutlineUser,
  HiOutlineQuestionMarkCircle,
  HiOutlineCheckCircle,
  HiArrowLeft,
  HiOutlinePaperAirplane,
} from 'react-icons/hi';

const categories = [
  { value: 'bug',        label: 'Bug / Error',    icon: HiOutlineSupport,             color: 'from-red-50 to-rose-50',     active: 'border-red-400 bg-red-50',    text: 'text-red-500' },
  { value: 'suggestion', label: 'Suggestion',      icon: HiOutlineLightBulb,           color: 'from-amber-50 to-yellow-50', active: 'border-amber-400 bg-amber-50',text: 'text-amber-500' },
  { value: 'content',   label: 'Content Issue',   icon: HiOutlineFlag,                color: 'from-orange-50 to-red-50',   active: 'border-orange-400 bg-orange-50', text: 'text-orange-500' },
  { value: 'account',   label: 'Account Issue',   icon: HiOutlineUser,                color: 'from-sky-50 to-blue-50',     active: 'border-sky-400 bg-sky-50',    text: 'text-sky-500' },
  { value: 'other',     label: 'Other',           icon: HiOutlineQuestionMarkCircle,  color: 'from-violet-50 to-purple-50',active: 'border-violet-400 bg-violet-50', text: 'text-violet-500' },
];

function ReportPage() {
  const { backendUrl } = useAuth();
  const navigate = useNavigate();

  const [category, setCategory] = useState('bug');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      setError('Please fill in all fields.');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${backendUrl}/api/reports`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ category, title, description }),
      });
      if (res.ok) {
        setSubmitted(true);
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Failed to submit report. Try again.');
      }
    } catch (err) {
      setError('Network error. Please check your connection.');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedCat = categories.find((c) => c.value === category);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-2xl mx-auto"
    >
      {/* Back button */}
      <button
        onClick={() => navigate('/')}
        id="report-back-btn"
        className="flex items-center gap-2 text-gray-400 hover:text-gray-700 transition mb-6 text-sm font-medium group"
      >
        <HiArrowLeft className="group-hover:-translate-x-1 transition-transform" />
        Back to Home
      </button>

      <AnimatePresence mode="wait">
        {submitted ? (
          /* ── Success State ── */
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="glass p-12 rounded-[2rem] shadow-sm text-center"
          >
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blush-400 via-white to-sky-400 rounded-t-[2rem]" />
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="w-24 h-24 rounded-full bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center mx-auto mb-6 shadow-md"
            >
              <HiOutlineCheckCircle className="text-5xl text-emerald-500" />
            </motion.div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Report Sent! 🎉</h2>
            <p className="text-gray-400 text-sm max-w-xs mx-auto mb-8">
              Thank you for letting us know. We'll review your report and get back to you as soon as possible.
            </p>
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate('/')}
              className="px-8 py-3 rounded-2xl bg-gradient-to-r from-blush-400 to-sky-400 text-white font-semibold shadow-md hover:shadow-lg transition"
            >
              Go back home
            </motion.button>
          </motion.div>
        ) : (
          /* ── Form State ── */
          <motion.div
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass p-8 md:p-10 rounded-[2rem] shadow-sm relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blush-400 via-white to-sky-400" />

            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-1">Report an Issue</h1>
            <p className="text-gray-400 text-sm mb-8">Tell us what's wrong — we'll fix it fast 🔧</p>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Category Selector */}
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-3">Category</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {categories.map((cat) => {
                    const Icon = cat.icon;
                    const isActive = category === cat.value;
                    return (
                      <motion.button
                        key={cat.value}
                        type="button"
                        id={`cat-${cat.value}`}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => setCategory(cat.value)}
                        className={`flex items-center gap-2 px-4 py-3 rounded-2xl border-2 text-sm font-medium transition-all
                          ${isActive
                            ? `${cat.active} ${cat.text} shadow-sm`
                            : 'border-gray-100 bg-white/50 text-gray-500 hover:border-gray-200'
                          }`}
                      >
                        <Icon className={`text-lg ${isActive ? cat.text : 'text-gray-400'}`} />
                        {cat.label}
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* Title */}
              <div>
                <label htmlFor="report-title" className="block text-sm font-semibold text-gray-600 mb-2">
                  Short Title
                </label>
                <input
                  id="report-title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={120}
                  placeholder="e.g. Photos not loading in gallery"
                  className="w-full px-4 py-3 rounded-2xl border border-gray-100 bg-white/60 text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blush-200 focus:border-blush-300 transition text-sm"
                />
              </div>

              {/* Description */}
              <div>
                <label htmlFor="report-desc" className="block text-sm font-semibold text-gray-600 mb-2">
                  Description
                </label>
                <textarea
                  id="report-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  maxLength={2000}
                  rows={5}
                  placeholder="Describe the issue in detail. What happened? What did you expect? When did it start?"
                  className="w-full px-4 py-3 rounded-2xl border border-gray-100 bg-white/60 text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blush-200 focus:border-blush-300 transition text-sm resize-none"
                />
                <p className="text-right text-xs text-gray-300 mt-1">{description.length}/2000</p>
              </div>

              {/* Error */}
              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-red-400 text-sm bg-red-50 px-4 py-2 rounded-xl"
                >
                  {error}
                </motion.p>
              )}

              {/* Submit */}
              <motion.button
                type="submit"
                id="report-submit-btn"
                disabled={submitting}
                whileHover={{ scale: submitting ? 1 : 1.02 }}
                whileTap={{ scale: submitting ? 1 : 0.98 }}
                className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-gradient-to-r from-blush-400 to-sky-400 text-white font-semibold shadow-md hover:shadow-lg transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Sending…
                  </>
                ) : (
                  <>
                    <HiOutlinePaperAirplane className="text-lg" />
                    Submit Report
                  </>
                )}
              </motion.button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default ReportPage;
