// vibecheck-disable SECAI006
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { HiOutlineUsers, HiOutlineHeart, HiOutlineChatAlt2, HiOutlineTrash, HiOutlineExclamationCircle, HiOutlineCheckCircle } from 'react-icons/hi';

function AdminDashboard() {
  const { backendUrl } = useAuth();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reportError, setReportError] = useState('');
  const [updatingReportIds, setUpdatingReportIds] = useState(new Set());

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const headers = { Authorization: `Bearer ${localStorage.getItem('token')}` };
        
        const [statsRes, usersRes, reportsRes] = await Promise.all([
          fetch(`${backendUrl}/api/admin/stats`, { headers }),
          fetch(`${backendUrl}/api/admin/users`, { headers }),
          fetch(`${backendUrl}/api/reports`, { headers }),
        ]);

        if (statsRes.ok) setStats(await statsRes.json());
        if (usersRes.ok) setUsers(await usersRes.json());
        if (reportsRes.ok) setReports(await reportsRes.json());
      } catch (err) {
        console.error('Error fetching admin data', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchAdminData();
  }, [backendUrl]);

  const handleDeleteUser = async (id, name) => {
    if (!window.confirm(`Are you sure you want to permanently delete user ${name}?`)) return;
    try {
      const res = await fetch(`${backendUrl}/api/admin/users/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        setUsers(users.filter(u => u._id !== id));
      }
    } catch (err) {
      alert('Failed to delete user');
    }
  };

  const handleReportStatusChange = async (reportId, newStatus) => {
    const previousStatus = reports.find((report) => report._id === reportId)?.status;
    setReportError('');
    setUpdatingReportIds((prev) => new Set(prev).add(reportId));
    setReports((prev) =>
      prev.map((report) => (report._id === reportId ? { ...report, status: newStatus } : report))
    );

    try {
      const res = await fetch(`${backendUrl}/api/reports/${reportId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || data.message || 'Could not update report status');
    } catch (err) {
      if (previousStatus) {
        setReports((prev) =>
          prev.map((report) => (report._id === reportId ? { ...report, status: previousStatus } : report))
        );
      }
      setReportError(err.message || 'Could not update report status');
    } finally {
      setUpdatingReportIds((prev) => {
        const next = new Set(prev);
        next.delete(reportId);
        return next;
      });
    }
  };

  if (loading) {
    return <div className="p-10 text-center text-gray-500">Loading admin dashboard...</div>;
  }

  if (error) {
    return <div className="p-10 text-center text-red-500">Error: {error}</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-6xl mx-auto py-10 px-4"
    >
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Super Admin Dashboard</h1>

      {/* Stats Grid */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <StatCard title="Total Users" value={stats.userCount} icon={<HiOutlineUsers />} color="bg-blue-50 text-blue-600" />
          <StatCard title="Couples" value={stats.coupleCount} icon={<HiOutlineHeart />} color="bg-pink-50 text-pink-600" />
          <StatCard title="Memories" value={stats.memoryCount} icon={<HiOutlineHeart />} color="bg-orange-50 text-orange-600" />
          <StatCard title="Messages" value={stats.messageCount} icon={<HiOutlineChatAlt2 />} color="bg-green-50 text-green-600" />
        </div>
      )}

      {/* Users Table */}
      <div className="glass rounded-[2rem] p-6 shadow-sm">
        <h2 className="text-xl font-bold text-gray-800 mb-6">All Registered Users</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="pb-3 text-sm font-semibold text-gray-500">Name</th>
                <th className="pb-3 text-sm font-semibold text-gray-500">Email</th>
                <th className="pb-3 text-sm font-semibold text-gray-500">Role</th>
                <th className="pb-3 text-sm font-semibold text-gray-500">Joined</th>
                <th className="pb-3 text-sm font-semibold text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user._id} className="border-b border-gray-100 last:border-none">
                  <td className="py-4">
                    <div className="flex items-center gap-3">
                      {user.avatarUrl ? (
                        <img src={user.avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-500">
                          {(user.name || user.email || '?').charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span className="font-medium text-gray-800">{user.name || user.email || 'Unknown'}</span>
                    </div>
                  </td>
                  <td className="py-4 text-gray-600">{user.email}</td>
                  <td className="py-4">
                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="py-4 text-gray-500 text-sm">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-4">
                    {user.role !== 'admin' && (
                      <button 
                        onClick={() => handleDeleteUser(user._id, user.name || user.email || 'User')}
                        className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                        title="Delete User"
                      >
                        <HiOutlineTrash className="text-lg" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {/* Reports Section */}
      <div className="glass rounded-[2rem] p-6 shadow-sm mt-8">
        <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <HiOutlineExclamationCircle className="text-blush-500" /> User Reports
        </h2>
        {reportError && (
          <div className="mb-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
            {reportError}
          </div>
        )}
        {reports.length === 0 ? (
          <div className="text-center py-10 text-gray-300">
            <HiOutlineCheckCircle className="text-5xl mx-auto mb-3" />
            <p className="font-medium">No reports yet — all clear! 🎉</p>
          </div>
        ) : (
          <div className="space-y-3">
            {reports.map((report) => {
              const statusColors = {
                open: 'bg-red-100 text-red-600',
                'in-review': 'bg-amber-100 text-amber-600',
                resolved: 'bg-green-100 text-green-600',
              };
              return (
                <div key={report._id} className="p-4 rounded-2xl bg-white/60 border border-gray-100 flex flex-col sm:flex-row sm:items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`px-2 py-0.5 text-xs rounded-full font-semibold ${statusColors[report.status] || statusColors.open}`}>
                        {report.status}
                      </span>
                      <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-500 font-medium capitalize">
                        {report.category}
                      </span>
                    </div>
                    <p className="font-semibold text-gray-800 truncate">{report.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{report.description}</p>
                    <p className="text-xs text-gray-300 mt-1">
                      {report.userEmail} · {new Date(report.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <select
                    value={report.status}
                    onChange={(e) => handleReportStatusChange(report._id, e.target.value)}
                    disabled={updatingReportIds.has(report._id)}
                    className="text-xs px-3 py-1.5 rounded-xl border border-gray-100 bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-blush-200 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <option value="open">Open</option>
                    <option value="in-review">In Review</option>
                    <option value="resolved">Resolved</option>
                  </select>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function StatCard({ title, value, icon, color }) {
  return (
    <div className="glass p-6 rounded-[2rem] flex items-center gap-4">
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
        <p className="text-2xl font-bold text-gray-800">{value}</p>
      </div>
    </div>
  );
}

export default AdminDashboard;
