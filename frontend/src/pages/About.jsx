import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { MainLogo } from '../components/MainLogo';
import {
  FaCamera,
  FaCalendarAlt,
  FaMicrophone,
  FaHeartbeat,
  FaLock,
  FaBan,
  FaGlobeAmericas,
  FaUserFriends,
  FaQuoteLeft,
  FaHeart,
  FaExpand,
  FaTimes,
} from 'react-icons/fa';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.1, ease: 'easeOut' },
  }),
};

const screenshots = [
  {
    url: '/ss/Screenshot 2026-07-23 234455.png',
    title: 'Live Location & Dark Map',
    description: 'Sleek Snapchat-style dark mode map with real-time movement, battery status, and distance tracking.',
    tag: 'Live Map',
  },
  {
    url: '/ss/Screenshot 2026-07-23 233209.png',
    title: 'Memories & Photo Gallery',
    description: 'Preserve photo memories and special moments in a beautiful, private digital gallery.',
    tag: 'Memories',
  },
  {
    url: '/ss/Screenshot 2026-07-23 233230.png',
    title: 'Mood Tracker & Check-ins',
    description: 'Track how your partner is feeling each day and get gentle insights into their emotional world.',
    tag: 'Moods',
  },
  {
    url: '/ss/Screenshot 2026-07-23 233241.png',
    title: 'Voice Notes & Audio Messages',
    description: 'Leave heartwarming voice notes for your partner to wake up to and replay anytime.',
    tag: 'Voice Notes',
  },
];

const features = [
  {
    icon: FaCamera,
    ramp: 'rose',
    title: 'Private snaps & gallery',
    body: "Share your moments instantly. Send disappearing snaps or build a beautiful, shared media gallery that only the two of you can access.",
  },
  {
    icon: FaCalendarAlt,
    ramp: 'sky',
    title: 'Shared calendar',
    body: "Never miss an important date. Track anniversaries, plan upcoming dates, and count down to the moments you're looking forward to.",
  },
  {
    icon: FaMicrophone,
    ramp: 'purple',
    title: 'Voice notes',
    body: "Sometimes text isn't enough. Leave voice notes for your person to wake up to, and build a collection of memories you can replay anytime.",
  },
  {
    icon: FaHeartbeat,
    ramp: 'orange',
    title: 'Moods & connection',
    body: "Keep in touch with how your partner is feeling. Track daily moods and get gentle insight into each other's emotional world.",
  },
];

const ramps = {
  rose: 'bg-rose-50 border-rose-100 text-rose-600',
  sky: 'bg-sky-50 border-sky-100 text-sky-600',
  purple: 'bg-purple-50 border-purple-100 text-purple-600',
  orange: 'bg-orange-50 border-orange-100 text-orange-600',
};

const audiences = [
  {
    icon: FaGlobeAmericas,
    title: 'Long-distance couples',
    body: 'Close the distance with daily check-ins, shared moods, and a calendar counting down to your next visit.',
  },
  {
    icon: FaUserFriends,
    title: 'Best friends',
    body: "Not every close bond is romantic. Keep a private space with your ride-or-die, wherever life takes you both.",
  },
  {
    icon: FaHeart,
    title: 'Family across the miles',
    body: 'Parents, siblings, or a partner abroad — voice notes and shared galleries keep everyday moments from getting lost.',
  },
];

const trustPoints = [
  { icon: FaLock, label: 'Private by default' },
  { icon: FaBan, label: 'No ads, ever' },
  { icon: FaHeart, label: 'Built for real connection' },
  { icon: FaGlobeAmericas, label: 'Works wherever you are' },
];

const testimonials = [
  {
    quote: "We're eleven time zones apart. loveforlove is the one place that actually feels like being in the same room.",
    name: 'Priya & Dev',
  },
  {
    quote: "I use it with my best friend, not a partner. Nobody else makes space for that, and honestly it works perfectly.",
    name: 'Ananya',
  },
  {
    quote: 'The voice notes feature alone changed how we say good morning to each other. Small thing, huge difference.',
    name: 'Rohit & Meera',
  },
];

const About = () => {
  const [activeScreenshot, setActiveScreenshot] = useState(null);

  return (
    <div className="min-h-screen bg-white font-sans text-gray-800">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-8 py-6 max-w-7xl mx-auto w-full relative z-10">
        <Link to="/login" className="flex items-center gap-2">
          <MainLogo className="w-10 h-10" />
          <span className="text-[#8b1c31] font-bold text-2xl tracking-tight">loveforlove</span>
        </Link>
        <Link to="/login" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">
          Back to home
        </Link>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 -right-24 w-96 h-96 rounded-full opacity-30 blur-3xl"
          style={{ background: 'linear-gradient(135deg, #ee2a7b, #f9ce34)' }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-32 -left-24 w-96 h-96 rounded-full opacity-20 blur-3xl"
          style={{ background: 'linear-gradient(135deg, #f26e4e, #ee2a7b)' }}
        />

        <main className="max-w-4xl mx-auto px-6 pt-16 pb-16 text-center relative">
          <motion.div initial="hidden" animate="show" variants={fadeUp}>
            <span className="inline-block text-xs font-bold tracking-[0.2em] uppercase text-[#ee2a7b] mb-4">
              Our story
            </span>
            <h1 className="text-5xl md:text-6xl font-extrabold text-[#8b1c31] mb-6 tracking-tight leading-[1.1]">
              A private world,
              <br className="hidden md:block" /> built for two.
            </h1>
            <p className="text-lg md:text-xl text-gray-600 leading-relaxed max-w-2xl mx-auto">
              A secure, ad-free private space for two people to stay connected, share live locations, track moods, and save everlasting memories together.
            </p>
          </motion.div>
        </main>
      </section>

      {/* App Screenshots Showcase */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          variants={fadeUp}
          className="text-center mb-12"
        >
          <span className="inline-block text-xs font-bold tracking-[0.2em] uppercase text-[#ee2a7b] mb-2">
            Inside the App
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-[#8b1c31] tracking-tight">
            See loveforlove in action
          </h2>
          <p className="text-gray-600 max-w-lg mx-auto mt-2 text-sm">
            Here is a sneak peek of the sleek interface, live location map, and memory vault crafted for you.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8">
          {screenshots.map((ss, i) => (
            <motion.div
              key={ss.title}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.2 }}
              custom={i}
              variants={fadeUp}
              onClick={() => setActiveScreenshot(ss)}
              className="group cursor-pointer bg-gradient-to-b from-gray-50 to-white rounded-3xl p-4 border border-gray-200/80 shadow-md hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300 relative overflow-hidden"
            >
              <div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-gray-900 shadow-inner">
                <img
                  src={ss.url}
                  alt={ss.title}
                  className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white font-medium text-sm backdrop-blur-[2px]">
                  <FaExpand className="text-lg" />
                  <span>Click to expand</span>
                </div>
                <span className="absolute top-3 left-3 bg-black/60 backdrop-blur-md text-white text-[11px] font-bold px-3 py-1 rounded-full border border-white/20">
                  {ss.tag}
                </span>
              </div>
              <div className="pt-4 px-2 pb-1">
                <h3 className="text-xl font-bold text-[#8b1c31] mb-1 group-hover:text-[#ee2a7b] transition-colors">
                  {ss.title}
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">{ss.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Screenshot Lightbox Modal */}
      <AnimatePresence>
        {activeScreenshot && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setActiveScreenshot(null)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-4xl w-full bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-800"
            >
              <button
                onClick={() => setActiveScreenshot(null)}
                className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-black/60 hover:bg-black text-white flex items-center justify-center transition-colors"
                title="Close"
              >
                <FaTimes />
              </button>
              <div className="max-h-[75vh] overflow-y-auto bg-black flex items-center justify-center">
                <img
                  src={activeScreenshot.url}
                  alt={activeScreenshot.title}
                  className="w-full h-auto object-contain max-h-[75vh]"
                />
              </div>
              <div className="p-6 bg-slate-900 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-[#ee2a7b] block mb-1">
                    {activeScreenshot.tag}
                  </span>
                  <h3 className="text-2xl font-bold">{activeScreenshot.title}</h3>
                  <p className="text-sm text-gray-400 mt-1">{activeScreenshot.description}</p>
                </div>
                <Link
                  to="/login"
                  className="px-6 py-2.5 rounded-full text-white font-semibold text-sm bg-gradient-to-r from-[#ee2a7b] to-[#f9ce34] hover:opacity-90 transition-opacity shrink-0"
                >
                  Try it now
                </Link>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>



      {/* Not just for couples */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.4 }}
          variants={fadeUp}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-extrabold text-[#8b1c31] mb-3 tracking-tight">
            Not just for couples
          </h2>
          <p className="text-gray-600 max-w-xl mx-auto">
            loveforlove is really about the space between two people who matter to each other. That's a partner
            for most people, but it doesn't have to be.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {audiences.map(({ icon: Icon, title, body }, i) => (
            <motion.div
              key={title}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.3 }}
              custom={i}
              variants={fadeUp}
              className="p-6 rounded-2xl bg-gray-50 border border-gray-100 text-left"
            >
              <Icon className="text-2xl text-[#ee2a7b] mb-4" aria-hidden="true" />
              <h3 className="text-lg font-bold text-[#8b1c31] mb-2">{title}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{body}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Trust strip */}
      <section className="border-y border-gray-100 bg-gray-50/60">
        <div className="max-w-5xl mx-auto px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-6">
          {trustPoints.map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-3 justify-center md:justify-start">
              <Icon className="text-[#ee2a7b] text-lg shrink-0" aria-hidden="true" />
              <span className="text-sm font-semibold text-gray-700">{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <motion.h2
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.4 }}
          variants={fadeUp}
          className="text-3xl md:text-4xl font-extrabold text-[#8b1c31] mb-10 text-center tracking-tight"
        >
          People who've found their space
        </motion.h2>
        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map(({ quote, name }, i) => (
            <motion.figure
              key={name}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.3 }}
              custom={i}
              variants={fadeUp}
              className="p-6 rounded-2xl bg-white border border-gray-100 shadow-sm"
            >
              <FaQuoteLeft className="text-[#f9ce34] text-xl mb-4" aria-hidden="true" />
              <blockquote className="text-gray-700 leading-relaxed mb-4 text-sm">{quote}</blockquote>
              <figcaption className="text-sm font-bold text-[#8b1c31]">{name}</figcaption>
            </motion.figure>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="max-w-4xl mx-auto px-6 pb-24 text-center">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.5 }}
          variants={fadeUp}
        >
          <p className="text-gray-500 font-medium mb-6">Ready to start your journey?</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/login"
              className="px-10 py-4 rounded-full text-white font-bold text-xl shadow-lg bg-gradient-to-r from-[#ee2a7b] via-[#f26e4e] to-[#f9ce34] hover:scale-105 transition-transform inline-block"
            >
              Sign up now
            </Link>
            <Link
              to="/login"
              className="text-gray-600 hover:text-gray-900 font-semibold underline underline-offset-4"
            >
              Already have an account? Sign in
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8">
        <div className="max-w-5xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <MainLogo className="w-6 h-6" />
            <span className="text-[#8b1c31] font-bold tracking-tight">loveforlove</span>
          </div>
          <p className="text-sm text-gray-400">Your connection, everlasting.</p>
        </div>
      </footer>
    </div>
  );
};

export default About;