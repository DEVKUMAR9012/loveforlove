import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  HiOutlineBell,
  HiOutlineCalendar,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlinePencilAlt,
  HiOutlinePhotograph,
  HiOutlinePlus,
  HiOutlineTrash,
  HiOutlineX,
} from 'react-icons/hi';
import { useAuth } from '../context/AuthContext';

const DAY_MS = 24 * 60 * 60 * 1000;
const YEARLY_CATEGORIES = new Set(['anniversary', 'birthday']);

const CATEGORY_CONFIG = {
  anniversary: {
    label: 'Anniversary',
    emoji: '💍',
    chip: 'bg-rose-100 text-rose-700 border-rose-200',
    dot: 'bg-rose-500',
    soft: 'bg-rose-50 text-rose-700 border-rose-100',
  },
  'date-night': {
    label: 'Date night',
    emoji: '🌹',
    chip: 'bg-pink-100 text-pink-700 border-pink-200',
    dot: 'bg-pink-500',
    soft: 'bg-pink-50 text-pink-700 border-pink-100',
  },
  birthday: {
    label: 'Birthday',
    emoji: '🎂',
    chip: 'bg-amber-100 text-amber-700 border-amber-200',
    dot: 'bg-amber-500',
    soft: 'bg-amber-50 text-amber-700 border-amber-100',
  },
  reminder: {
    label: 'Reminder',
    emoji: '📌',
    chip: 'bg-violet-100 text-violet-700 border-violet-200',
    dot: 'bg-violet-500',
    soft: 'bg-violet-50 text-violet-700 border-violet-100',
  },
  trip: {
    label: 'Trip',
    emoji: '✈️',
    chip: 'bg-sky-100 text-sky-700 border-sky-200',
    dot: 'bg-sky-500',
    soft: 'bg-sky-50 text-sky-700 border-sky-100',
  },
};

const REMINDER_OPTIONS = [
  { value: 'one-day-before', label: '1 day before' },
  { value: 'same-day', label: 'Same day' },
  { value: 'both', label: 'Both' },
  { value: 'none', label: 'No reminder' },
];

const pad = (value) => String(value).padStart(2, '0');

const toDateKey = (date) => {
  const localDate = date instanceof Date ? date : new Date(date);
  return `${localDate.getFullYear()}-${pad(localDate.getMonth() + 1)}-${pad(localDate.getDate())}`;
};

const parseDateKey = (dateKey) => {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(year, month - 1, day);
};

const parseEventDate = (value) => {
  if (!value) return new Date();
  if (typeof value === 'string') return parseDateKey(value.slice(0, 10));
  return parseDateKey(toDateKey(value));
};

const startOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

const startOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1);

const daysBetween = (futureDate, baseDate) =>
  Math.round((startOfDay(futureDate).getTime() - startOfDay(baseDate).getTime()) / DAY_MS);

const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();

const getAnnualOccurrence = (event, year) => {
  const baseDate = parseEventDate(event.date);
  const month = baseDate.getMonth();
  const day = Math.min(baseDate.getDate(), getDaysInMonth(year, month));
  return new Date(year, month, day);
};

const getOccurrencesInRange = (events, rangeStart, rangeEnd) => {
  const start = startOfDay(rangeStart);
  const end = startOfDay(rangeEnd);
  const occurrences = [];

  events.forEach((event) => {
    if (event.recurrence === 'yearly') {
      for (let year = start.getFullYear() - 1; year <= end.getFullYear() + 1; year += 1) {
        const occurrenceDate = getAnnualOccurrence(event, year);
        if (occurrenceDate >= start && occurrenceDate <= end) {
          occurrences.push({
            ...event,
            occurrenceDate,
            dateKey: toDateKey(occurrenceDate),
            occurrenceKey: `${event._id}-${toDateKey(occurrenceDate)}`,
          });
        }
      }
      return;
    }

    const occurrenceDate = parseEventDate(event.date);
    if (occurrenceDate >= start && occurrenceDate <= end) {
      occurrences.push({
        ...event,
        occurrenceDate,
        dateKey: toDateKey(occurrenceDate),
        occurrenceKey: `${event._id}-${toDateKey(occurrenceDate)}`,
      });
    }
  });

  return occurrences.sort((a, b) => {
    const dateSort = a.occurrenceDate.getTime() - b.occurrenceDate.getTime();
    return dateSort || a.title.localeCompare(b.title);
  });
};

const getNextOccurrence = (event, today) => {
  const start = startOfDay(today);

  if (event.recurrence === 'yearly') {
    let occurrenceDate = getAnnualOccurrence(event, start.getFullYear());
    if (occurrenceDate < start) occurrenceDate = getAnnualOccurrence(event, start.getFullYear() + 1);
    return {
      ...event,
      occurrenceDate,
      dateKey: toDateKey(occurrenceDate),
      occurrenceKey: `${event._id}-${toDateKey(occurrenceDate)}`,
    };
  }

  const occurrenceDate = parseEventDate(event.date);
  if (occurrenceDate < start) return null;

  return {
    ...event,
    occurrenceDate,
    dateKey: toDateKey(occurrenceDate),
    occurrenceKey: `${event._id}-${toDateKey(occurrenceDate)}`,
  };
};

const formatMonth = (date) =>
  date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

const formatFullDate = (date) =>
  date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });

const formatMemoryLabel = (memory) => {
  const label = memory.caption || memory.title || 'Gallery memory';
  const date = memory.date ? new Date(memory.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';
  return date ? `${label} · ${date}` : label;
};

const getId = (value) => {
  if (!value) return '';
  if (typeof value === 'object') return String(value._id || value.id || '');
  return String(value);
};

const getCategory = (category) => CATEGORY_CONFIG[category] || CATEGORY_CONFIG.reminder;

const defaultForm = (dateKey) => ({
  title: '',
  date: dateKey,
  category: 'date-night',
  notes: '',
  recurrence: 'none',
  reminder: 'one-day-before',
  photoUrl: '',
  photoMemoryId: '',
});

function SharedCalendar() {
  const { user, backendUrl } = useAuth();
  const [cursorDate, setCursorDate] = useState(() => startOfMonth(new Date()));
  const [events, setEvents] = useState([]);
  const [memories, setMemories] = useState([]);
  const [selectedDateKey, setSelectedDateKey] = useState(() => toDateKey(new Date()));
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [form, setForm] = useState(() => defaultForm(toDateKey(new Date())));
  const [formError, setFormError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [now, setNow] = useState(new Date());

  const today = useMemo(() => startOfDay(now), [now]);
  const todayKey = toDateKey(today);

  const fetchCalendar = useCallback(async () => {
    setIsLoading(true);
    setLoadError('');

    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const [eventsResult, memoriesResult] = await Promise.allSettled([
        fetch(`${backendUrl}/api/calendar`, { headers }),
        fetch(`${backendUrl}/api/memories`, { headers }),
      ]);

      if (eventsResult.status !== 'fulfilled') throw eventsResult.reason;
      const eventsRes = eventsResult.value;
      if (!eventsRes.ok) throw new Error(`Calendar responded ${eventsRes.status}`);
      const eventData = await eventsRes.json();
      setEvents(eventData);

      if (memoriesResult.status !== 'fulfilled') {
        console.warn('Failed to load calendar memories:', memoriesResult.reason);
        return;
      }
      const memoriesRes = memoriesResult.value;
      if (memoriesRes.ok) {
        const memoryData = await memoriesRes.json();
        setMemories(memoryData.filter((memory) => memory.imageUrl));
      }
    } catch (err) {
      console.error('Failed to load calendar:', err);
      setLoadError("Couldn't load the shared calendar. Check the server and try again.");
    } finally {
      setIsLoading(false);
    }
  }, [backendUrl]);

  useEffect(() => {
    fetchCalendar();
  }, [fetchCalendar]);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60 * 1000);
    return () => clearInterval(timer);
  }, []);

  const visibleRange = useMemo(() => {
    const firstDay = startOfMonth(cursorDate);
    const gridStart = new Date(firstDay);
    gridStart.setDate(firstDay.getDate() - firstDay.getDay());

    const gridEnd = new Date(gridStart);
    gridEnd.setDate(gridStart.getDate() + 41);

    return { gridStart, gridEnd };
  }, [cursorDate]);

  const visibleOccurrences = useMemo(
    () => getOccurrencesInRange(events, visibleRange.gridStart, visibleRange.gridEnd),
    [events, visibleRange]
  );

  const eventsByDay = useMemo(() => {
    return visibleOccurrences.reduce((acc, event) => {
      if (!acc[event.dateKey]) acc[event.dateKey] = [];
      acc[event.dateKey].push(event);
      return acc;
    }, {});
  }, [visibleOccurrences]);

  const calendarDays = useMemo(() => {
    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(visibleRange.gridStart);
      date.setDate(visibleRange.gridStart.getDate() + index);
      const dateKey = toDateKey(date);

      return {
        date,
        dateKey,
        events: eventsByDay[dateKey] || [],
        isCurrentMonth: date.getMonth() === cursorDate.getMonth(),
        isSelected: dateKey === selectedDateKey,
        isToday: dateKey === todayKey,
      };
    });
  }, [cursorDate, eventsByDay, selectedDateKey, todayKey, visibleRange]);

  const selectedEvents = eventsByDay[selectedDateKey] || [];
  const selectedDate = parseDateKey(selectedDateKey);

  const upcomingEvent = useMemo(() => {
    return events
      .map((event) => getNextOccurrence(event, today))
      .filter(Boolean)
      .sort((a, b) => a.occurrenceDate.getTime() - b.occurrenceDate.getTime())[0] || null;
  }, [events, today]);

  const reminderEvents = useMemo(() => {
    return events
      .map((event) => getNextOccurrence(event, today))
      .filter(Boolean)
      .filter((event) => {
        const days = daysBetween(event.occurrenceDate, today);
        if (days === 0) return ['same-day', 'both'].includes(event.reminder);
        if (days === 1) return ['one-day-before', 'both'].includes(event.reminder);
        return false;
      })
      .sort((a, b) => a.occurrenceDate.getTime() - b.occurrenceDate.getTime())
      .slice(0, 3);
  }, [events, today]);

  const openAddModal = (dateKey = selectedDateKey) => {
    setEditingEvent(null);
    setForm(defaultForm(dateKey));
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (event) => {
    setEditingEvent(event);
    setForm({
      title: event.title || '',
      date: toDateKey(parseEventDate(event.date)),
      category: event.category || 'reminder',
      notes: event.notes || '',
      recurrence: event.recurrence || 'none',
      reminder: event.reminder || 'one-day-before',
      photoUrl: event.photoUrl || '',
      photoMemoryId: getId(event.photoMemoryId),
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (isSaving) return;
    setIsModalOpen(false);
    setEditingEvent(null);
    setFormError('');
  };

  const handleCategoryChange = (category) => {
    setForm((prev) => ({
      ...prev,
      category,
      recurrence: YEARLY_CATEGORIES.has(category) ? 'yearly' : prev.recurrence,
    }));
  };

  const handleMemorySelect = (memoryId) => {
    const memory = memories.find((item) => item._id === memoryId);
    setForm((prev) => ({
      ...prev,
      photoMemoryId: memoryId,
      photoUrl: memory?.imageUrl || prev.photoUrl,
    }));
  };

  const saveEvent = async (event) => {
    event.preventDefault();
    setFormError('');

    const payload = {
      ...form,
      title: form.title.trim(),
      notes: form.notes.trim(),
      photoUrl: form.photoUrl.trim(),
      photoMemoryId: form.photoMemoryId || null,
      recurrence: YEARLY_CATEGORIES.has(form.category) ? 'yearly' : form.recurrence,
    };

    if (!payload.title) {
      setFormError('Please add a title for this day.');
      return;
    }

    setIsSaving(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(
        editingEvent ? `${backendUrl}/api/calendar/${editingEvent._id}` : `${backendUrl}/api/calendar`,
        {
          method: editingEvent ? 'PUT' : 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      const saved = await res.json();
      if (!res.ok) {
        const message = saved.errors?.map((item) => item.message).join(', ') || saved.error || 'Could not save event';
        throw new Error(message);
      }

      setEvents((prev) =>
        editingEvent
          ? prev.map((item) => (item._id === saved._id ? saved : item))
          : [...prev, saved]
      );
      setSelectedDateKey(payload.date);
      setCursorDate(startOfMonth(parseDateKey(payload.date)));
      closeModal();
    } catch (err) {
      setFormError(err.message || 'Could not save event');
    } finally {
      setIsSaving(false);
    }
  };

  const deleteEvent = async (event) => {
    const ok = window.confirm(`Delete "${event.title}" from the shared calendar?`);
    if (!ok) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${backendUrl}/api/calendar/${event._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error('Delete failed');
      setEvents((prev) => prev.filter((item) => item._id !== event._id));
    } catch (err) {
      console.error('Failed to delete calendar event:', err);
      setLoadError("Couldn't delete that event. Please try again.");
    }
  };

  const goToPreviousMonth = () => {
    setCursorDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCursorDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const goToToday = () => {
    const current = new Date();
    setCursorDate(startOfMonth(current));
    setSelectedDateKey(toDateKey(current));
  };

  const selectedMemory = memories.find((memory) => memory._id === form.photoMemoryId);
  const countdownDays = upcomingEvent ? daysBetween(upcomingEvent.occurrenceDate, today) : null;
  const countdownCategory = upcomingEvent ? getCategory(upcomingEvent.category) : null;

  const countdownText = useMemo(() => {
    if (!upcomingEvent) return 'Add your next special day to start the countdown.';
    if (countdownDays === 0) return `Aaj hai ${upcomingEvent.title} ${countdownCategory.emoji}`;
    if (countdownDays === 1) return `Kal hai ${upcomingEvent.title} ${countdownCategory.emoji}`;
    return `${countdownDays} din baad hai ${upcomingEvent.title} ${countdownCategory.emoji}`;
  }, [countdownCategory, countdownDays, upcomingEvent]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-7xl mx-auto h-full space-y-6"
    >
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-sky-100 text-sky-600 flex items-center justify-center shadow-sm">
              <HiOutlineCalendar className="text-2xl" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-gray-400 font-semibold">Shared calendar</p>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-800">Our special days</h1>
            </div>
          </div>
          <p className="text-gray-500">Important dates, reminders, trips, and memories in one place.</p>
        </div>

        <button
          onClick={() => openAddModal(selectedDateKey)}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-sky-500 text-white font-semibold hover:bg-sky-600 shadow-sm"
        >
          <HiOutlinePlus className="text-xl" />
          Add event
        </button>
      </div>

      <div className="grid lg:grid-cols-[minmax(0,1fr)_360px] gap-5">
        <div className="space-y-5">
          <div className="grid md:grid-cols-[minmax(0,1.4fr)_minmax(260px,0.8fr)] gap-4">
            <div className="rounded-2xl border border-rose-100 bg-gradient-to-r from-rose-50 via-white to-sky-50 p-5 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="text-4xl">{countdownCategory?.emoji || '💕'}</div>
                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-[0.2em] text-gray-400 font-semibold">Next countdown</p>
                  <h2 className="text-2xl font-bold text-gray-800 mt-1">{countdownText}</h2>
                  {upcomingEvent && (
                    <p className="text-sm text-gray-500 mt-1">
                      {formatFullDate(upcomingEvent.occurrenceDate)}
                      {upcomingEvent.recurrence === 'yearly' ? ' · repeats yearly' : ''}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/70 bg-white/70 backdrop-blur p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <HiOutlineBell className="text-xl text-amber-500" />
                <h2 className="font-bold text-gray-800">Reminder banner</h2>
              </div>
              {reminderEvents.length > 0 ? (
                <div className="space-y-2">
                  {reminderEvents.map((event) => {
                    const days = daysBetween(event.occurrenceDate, today);
                    const category = getCategory(event.category);
                    return (
                      <div key={event.occurrenceKey} className={`px-3 py-2 rounded-xl border text-sm ${category.soft}`}>
                        {days === 0 ? 'Aaj' : 'Kal'}: {category.emoji} {event.title}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-gray-400">No same-day or 1-day reminder due right now.</p>
              )}
            </div>
          </div>

          <div className="glass p-4 md:p-6 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">{formatMonth(cursorDate)}</h2>
                <p className="text-sm text-gray-400">Today is {formatFullDate(today)}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={goToPreviousMonth}
                  title="Previous month"
                  aria-label="Previous month"
                  className="p-3 rounded-xl bg-white/70 hover:bg-white text-gray-600 shadow-sm"
                >
                  <HiOutlineChevronLeft />
                </button>
                <button
                  onClick={goToToday}
                  className="px-4 py-2.5 rounded-xl bg-white/70 hover:bg-white text-gray-700 font-semibold shadow-sm"
                >
                  Today
                </button>
                <button
                  onClick={goToNextMonth}
                  title="Next month"
                  aria-label="Next month"
                  className="p-3 rounded-xl bg-white/70 hover:bg-white text-gray-600 shadow-sm"
                >
                  <HiOutlineChevronRight />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-2 text-center mb-3">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} className="text-xs md:text-sm font-bold text-gray-400 uppercase tracking-wide">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-2 md:gap-3">
              {calendarDays.map((day) => {
                const eventCount = day.events.length;
                return (
                  <button
                    key={day.dateKey}
                    onClick={() => setSelectedDateKey(day.dateKey)}
                    className={`relative min-h-[5.5rem] md:min-h-[7rem] rounded-2xl border p-2 text-left transition shadow-sm
                      ${day.isCurrentMonth ? 'bg-white/60 hover:bg-white border-white/80' : 'bg-white/25 border-white/40 text-gray-300'}
                      ${day.isSelected ? 'ring-2 ring-sky-400 bg-sky-50/90' : ''}
                      ${day.isToday ? 'border-sky-400 shadow-md' : ''}
                    `}
                  >
                    <div className="flex items-start justify-between gap-1">
                      <span
                        className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold
                          ${day.isToday ? 'bg-sky-500 text-white' : day.isCurrentMonth ? 'text-gray-700' : 'text-gray-300'}
                        `}
                      >
                        {day.date.getDate()}
                      </span>
                      {eventCount > 1 && (
                        <span className="min-w-[1.5rem] h-6 px-1 rounded-full bg-gray-800 text-white text-xs font-bold flex items-center justify-center">
                          {eventCount}
                        </span>
                      )}
                    </div>

                    <div className="mt-2 hidden md:space-y-1 md:block">
                      {day.events.slice(0, 2).map((event) => {
                        const category = getCategory(event.category);
                        return (
                          <div key={event.occurrenceKey} className={`truncate rounded-lg px-2 py-1 text-[11px] font-semibold ${category.soft}`}>
                            {category.emoji} {event.title}
                          </div>
                        );
                      })}
                    </div>

                    <div className="absolute bottom-2 left-2 right-2 flex items-center gap-1 md:hidden">
                      {day.events.slice(0, 4).map((event) => (
                        <span key={event.occurrenceKey} className={`h-1.5 flex-1 rounded-full ${getCategory(event.category).dot}`} />
                      ))}
                    </div>

                    {eventCount > 2 && (
                      <span className="hidden md:block absolute bottom-2 right-2 text-[11px] font-bold text-gray-400">
                        +{eventCount - 2}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {isLoading && (
              <div className="mt-5 rounded-2xl bg-white/70 p-4 text-center text-sm text-gray-500">
                Loading calendar events...
              </div>
            )}

            {loadError && (
              <div className="mt-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                <span>{loadError}</span>
                <button onClick={fetchCalendar} className="self-start sm:self-auto font-bold underline">
                  Retry
                </button>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {Object.entries(CATEGORY_CONFIG).map(([key, category]) => (
              <span key={key} className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold ${category.chip}`}>
                <span className={`h-2 w-2 rounded-full ${category.dot}`} />
                {category.emoji} {category.label}
              </span>
            ))}
          </div>
        </div>

        <aside className="glass p-5 shadow-sm h-fit lg:sticky lg:top-6">
          <div className="flex items-start justify-between gap-3 mb-5">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-gray-400 font-semibold">Selected day</p>
              <h2 className="text-2xl font-bold text-gray-800 mt-1">{formatFullDate(selectedDate)}</h2>
            </div>
            <button
              onClick={() => openAddModal(selectedDateKey)}
              title="Add event"
              aria-label="Add event"
              className="p-3 rounded-xl bg-sky-500 text-white hover:bg-sky-600 shadow-sm"
            >
              <HiOutlinePlus className="text-xl" />
            </button>
          </div>

          {selectedEvents.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-white/50 p-6 text-center">
              <div className="mx-auto mb-3 h-12 w-12 rounded-2xl bg-blush-50 text-2xl flex items-center justify-center">💕</div>
              <p className="font-bold text-gray-700">No events yet</p>
              <p className="text-sm text-gray-400 mt-1">Add something special for this date.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {selectedEvents.map((event) => {
                const category = getCategory(event.category);
                const isMine = getId(event.userId) === getId(user?._id);
                const creatorName = isMine ? 'You' : event.createdBy?.name || 'Partner';

                return (
                  <motion.div
                    key={event.occurrenceKey}
                    layout
                    className="rounded-2xl border border-white/80 bg-white/70 p-4 shadow-sm"
                  >
                    <div className="flex items-start gap-3">
                      {event.photoUrl ? (
                        <img
                          src={event.photoUrl}
                          alt={event.title}
                          className="h-14 w-14 rounded-xl object-cover bg-gray-100"
                        />
                      ) : (
                        <div className={`h-14 w-14 rounded-xl flex items-center justify-center text-2xl border ${category.soft}`}>
                          {category.emoji}
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-bold ${category.chip}`}>
                            {category.emoji} {category.label}
                          </span>
                          {event.recurrence === 'yearly' && (
                            <span className="rounded-full bg-mint-100 text-mint-700 px-2 py-0.5 text-[11px] font-bold">
                              Yearly
                            </span>
                          )}
                        </div>
                        <h3 className="font-bold text-gray-800 truncate">{event.title}</h3>
                        {event.notes && <p className="text-sm text-gray-500 mt-1 line-clamp-2">{event.notes}</p>}
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        {event.createdBy?.avatarUrl ? (
                          <img
                            src={event.createdBy.avatarUrl}
                            alt={creatorName}
                            className="h-7 w-7 rounded-full object-cover"
                          />
                        ) : (
                          <span className="h-7 w-7 rounded-full bg-gray-100 flex items-center justify-center">
                            {isMine ? '🧑' : '💑'}
                          </span>
                        )}
                        <span>{creatorName}</span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEditModal(event)}
                          title="Edit event"
                          aria-label="Edit event"
                          className="p-2 rounded-lg text-gray-500 hover:text-sky-600 hover:bg-sky-50"
                        >
                          <HiOutlinePencilAlt />
                        </button>
                        <button
                          onClick={() => deleteEvent(event)}
                          title="Delete event"
                          aria-label="Delete event"
                          className="p-2 rounded-lg text-gray-500 hover:text-rose-600 hover:bg-rose-50"
                        >
                          <HiOutlineTrash />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </aside>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/45 p-4"
            onClick={closeModal}
          >
            <motion.form
              initial={{ opacity: 0, y: 24, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              onSubmit={saveEvent}
              onClick={(event) => event.stopPropagation()}
              className="w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl"
            >
              <div className="flex items-start justify-between gap-4 mb-6">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-gray-400 font-semibold">
                    {editingEvent ? 'Edit event' : 'New event'}
                  </p>
                  <h2 className="text-2xl font-bold text-gray-800 mt-1">
                    {editingEvent ? 'Update special day' : 'Add special day'}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={closeModal}
                  title="Close"
                  aria-label="Close"
                  className="p-2 rounded-xl text-gray-500 hover:bg-gray-100"
                >
                  <HiOutlineX className="text-xl" />
                </button>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <label className="md:col-span-2">
                  <span className="block text-sm font-bold text-gray-700 mb-2">Title</span>
                  <input
                    value={form.title}
                    onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                    maxLength={80}
                    className="w-full rounded-2xl border border-gray-200 px-4 py-3 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
                    placeholder="Dinner reservation, birthday, flight..."
                  />
                </label>

                <label>
                  <span className="block text-sm font-bold text-gray-700 mb-2">Date</span>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(event) => setForm((prev) => ({ ...prev, date: event.target.value }))}
                    className="w-full rounded-2xl border border-gray-200 px-4 py-3 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
                  />
                </label>

                <label>
                  <span className="block text-sm font-bold text-gray-700 mb-2">Category</span>
                  <select
                    value={form.category}
                    onChange={(event) => handleCategoryChange(event.target.value)}
                    className="w-full rounded-2xl border border-gray-200 px-4 py-3 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
                  >
                    {Object.entries(CATEGORY_CONFIG).map(([value, category]) => (
                      <option key={value} value={value}>
                        {category.emoji} {category.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  <span className="block text-sm font-bold text-gray-700 mb-2">Repeat</span>
                  <select
                    value={YEARLY_CATEGORIES.has(form.category) ? 'yearly' : form.recurrence}
                    disabled={YEARLY_CATEGORIES.has(form.category)}
                    onChange={(event) => setForm((prev) => ({ ...prev, recurrence: event.target.value }))}
                    className="w-full rounded-2xl border border-gray-200 px-4 py-3 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100 disabled:bg-gray-50 disabled:text-gray-400"
                  >
                    <option value="none">Does not repeat</option>
                    <option value="yearly">Every year</option>
                  </select>
                </label>

                <label>
                  <span className="block text-sm font-bold text-gray-700 mb-2">Reminder</span>
                  <select
                    value={form.reminder}
                    onChange={(event) => setForm((prev) => ({ ...prev, reminder: event.target.value }))}
                    className="w-full rounded-2xl border border-gray-200 px-4 py-3 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
                  >
                    {REMINDER_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="md:col-span-2">
                  <span className="block text-sm font-bold text-gray-700 mb-2">Photo from gallery</span>
                  <select
                    value={form.photoMemoryId}
                    onChange={(event) => handleMemorySelect(event.target.value)}
                    className="w-full rounded-2xl border border-gray-200 px-4 py-3 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
                  >
                    <option value="">No linked gallery memory</option>
                    {memories.map((memory) => (
                      <option key={memory._id} value={memory._id}>
                        {formatMemoryLabel(memory)}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="md:col-span-2">
                  <span className="block text-sm font-bold text-gray-700 mb-2">Photo URL</span>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      value={form.photoUrl}
                      onChange={(event) => setForm((prev) => ({ ...prev, photoUrl: event.target.value }))}
                      className="min-w-0 flex-1 rounded-2xl border border-gray-200 px-4 py-3 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
                      placeholder="https://..."
                    />
                    <div className="h-20 w-20 rounded-2xl border border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden shrink-0">
                      {form.photoUrl ? (
                        <img src={form.photoUrl} alt="Selected memory" className="h-full w-full object-cover" />
                      ) : (
                        <HiOutlinePhotograph className="text-2xl text-gray-300" />
                      )}
                    </div>
                  </div>
                  {selectedMemory && (
                    <p className="text-xs text-gray-400 mt-2">Linked to: {formatMemoryLabel(selectedMemory)}</p>
                  )}
                </label>

                <label className="md:col-span-2">
                  <span className="block text-sm font-bold text-gray-700 mb-2">Notes</span>
                  <textarea
                    value={form.notes}
                    onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
                    rows={3}
                    maxLength={500}
                    className="w-full resize-none rounded-2xl border border-gray-200 px-4 py-3 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
                    placeholder="Place, plan, gift idea, or the little detail you do not want to forget."
                  />
                </label>
              </div>

              {formError && (
                <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {formError}
                </div>
              )}

              <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-5 py-3 rounded-2xl bg-gray-100 text-gray-600 font-semibold hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-sky-500 text-white font-semibold hover:bg-sky-600 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <HiOutlineCalendar className="text-xl" />
                  {isSaving ? 'Saving...' : editingEvent ? 'Save changes' : 'Add event'}
                </button>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default SharedCalendar;
