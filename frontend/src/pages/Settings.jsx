// vibecheck-disable SECAI006
import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

function Settings() {
  const { user, backendUrl, updateRelationshipDate } = useAuth();
  const [date, setDate] = useState(() => 
    user?.relationshipStartDate ? new Date(user.relationshipStartDate).toISOString().split('T')[0] : ''
  );
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');

  const handleSaveDate = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage('');
    try {
      const res = await fetch(`${backendUrl}/api/settings/relationship-date`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ date }),
      });
      if (!res.ok) throw new Error('Failed to update date');
      const data = await res.json();
      updateRelationshipDate(data.relationshipStartDate);
      setMessage('Anniversary date updated successfully! 🎉');
    } catch (err) {
      setMessage('Error updating date.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleExport = () => {
    // In a real app, this would trigger a download from a backend endpoint
    alert('This feature will compile all your memories and messages into a beautiful PDF in the future!');
  };

  const handleReset = async () => {
    if (!window.confirm('Are you absolutely sure? This will disconnect you from your partner and reset your settings.')) return;
    try {
      const res = await fetch(`${backendUrl}/api/settings/danger-zone`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (res.ok) {
        alert('App has been reset.');
        window.location.reload();
      }
    } catch (err) {
      alert('Failed to reset app.');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto py-10 px-4"
    >
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Settings</h1>

      <div className="bg-white/60 p-6 rounded-[2rem] shadow-sm border border-white/80 mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Relationship Details</h2>
        <form onSubmit={handleSaveDate} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Our Anniversary Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-2 rounded-xl bg-white/80 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blush-400"
            />
          </div>
          <button
            type="submit"
            disabled={isSaving}
            className="self-start px-6 py-2 bg-blush-500 text-white rounded-full font-medium hover:bg-blush-600 transition disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save Date'}
          </button>
          {message && <p className="text-sm text-green-600">{message}</p>}
        </form>
      </div>

      <div className="bg-white/60 p-6 rounded-[2rem] shadow-sm border border-white/80 mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Export Data</h2>
        <p className="text-sm text-gray-500 mb-4">Download a copy of all your memories, messages, and photos.</p>
        <button
          onClick={handleExport}
          className="px-6 py-2 bg-white text-gray-800 border border-gray-200 rounded-full font-medium hover:bg-gray-50 transition shadow-sm"
        >
          Request Data Export
        </button>
      </div>

      <div className="bg-red-50 p-6 rounded-[2rem] shadow-sm border border-red-100">
        <h2 className="text-xl font-semibold text-red-800 mb-2">Danger Zone</h2>
        <p className="text-sm text-red-600 mb-4">Disconnect from your partner and reset all relationship settings. This action is irreversible.</p>
        <button
          onClick={handleReset}
          className="px-6 py-2 bg-red-500 text-white rounded-full font-medium hover:bg-red-600 transition"
        >
          Reset Account Data
        </button>
      </div>
    </motion.div>
  );
}

export default Settings;
