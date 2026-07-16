import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
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
} from 'react-icons/fa';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.1, ease: 'easeOut' },
  }),
};

const LogoMark = ({ className }) => (
  <svg viewBox="0 0 200 200" className={className} xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="logoGradientSmall" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#ee2a7b" />
        <stop offset="50%" stopColor="#f26e4e" />
        <stop offset="100%" stopColor="#f9ce34" />
      </linearGradient>
    </defs>
    <path
      d="M90,58 C95,33 115,14 150,17 C182,20 186,54 168,75 C150,98 122,136 100,180"
      fill="none"
      stroke="url(#logoGradientSmall)"
      strokeWidth="22"
      strokeLinecap="round"
      strokeLinejoin="round"
      opacity="0.85"
    />
    <path
      d="M110,58 C105,33 85,14 50,17 C18,20 14,54 32,75 C50,98 78,136 100,180"
      fill="none"
      stroke="url(#logoGradientSmall)"
      strokeWidth="22"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

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
  return (
    <div className="min-h-screen bg-white font-sans text-gray-800">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-8 py-6 max-w-7xl mx-auto w-full relative z-10">
        <Link to="/login" className="flex items-center gap-2">
          <LogoMark className="w-10 h-10" />
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

        <main className="max-w-4xl mx-auto px-6 pt-16 pb-24 text-center relative">
          <motion.div initial="hidden" animate="show" variants={fadeUp}>
            <span className="inline-block text-xs font-bold tracking-[0.2em] uppercase text-[#ee2a7b] mb-4">
              Our story
            </span>
            <h1 className="text-5xl md:text-6xl font-extrabold text-[#8b1c31] mb-6 tracking-tight leading-[1.1]">
              A private world,
              <br className="hidden md:block" /> built for two.
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed mb-4 max-w-2xl mx-auto">
              loveforlove is a secure, ad-free space designed to help two people stay close, share memories, and
              nurture a bond, no matter the distance between you.
            </p>
            <p className="text-base text-gray-500 max-w-xl mx-auto">
              Made first for couples. Loved just as much by best friends and family who want one honest, private
              place of their own.
            </p>
          </motion.div>
        </main>
      </section>

      {/* Feature grid */}
      <section className="max-w-5xl mx-auto px-6 pb-8">
        <div className="grid md:grid-cols-2 gap-6 text-left">
          {features.map(({ icon: Icon, ramp, title, body }, i) => (
            <motion.div
              key={title}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.3 }}
              custom={i}
              variants={fadeUp}
              className="p-8 rounded-3xl bg-white border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
            >
              <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center mb-5 ${ramps[ramp]}`}>
                <Icon className="text-xl" aria-hidden="true" />
              </div>
              <h3 className="text-xl font-bold text-[#8b1c31] mb-2">{title}</h3>
              <p className="text-gray-600 leading-relaxed">{body}</p>
            </motion.div>
          ))}
        </div>
      </section>

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
            <LogoMark className="w-6 h-6" />
            <span className="text-[#8b1c31] font-bold tracking-tight">loveforlove</span>
          </div>
          <p className="text-sm text-gray-400">Your connection, everlasting.</p>
        </div>
      </footer>
    </div>
  );
};

export default About;