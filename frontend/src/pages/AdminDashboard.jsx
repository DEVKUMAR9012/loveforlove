// vibecheck-disable SECAI006
import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import {
  HiOutlineUsers, HiOutlineHeart, HiOutlineChatAlt2, HiOutlineTrash, HiOutlineExclamationCircle,
  HiOutlineCheckCircle, HiOutlineSearch, HiOutlinePencil, HiOutlineX, HiOutlineChevronLeft,
  HiOutlineChevronRight, HiOutlineRefresh, HiOutlineEye, HiOutlineShieldCheck, HiOutlineUserRemove
} from 'react-icons/hi';

// --- Reusable Modal for editing user / viewing report details ---
function Modal({ isOpen, onClose, title, children }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 relative"
            initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800">{title}</h3>
              <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400">
                <HiOutlineX className="text-xl" />
              </button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function AdminDashboard() {
  const { backendUrl } = useAuth();

  // --- Data ---
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- UI state ---
  const [reportError, setReportError] = useState('');
  const [updatingReportIds, setUpdatingReportIds] = useState(new Set());
  const [deletingUserIds, setDeletingUserIds] = useState(new Set());

  // --- User management modals & search/pagination ---
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all'); // 'all', 'user', 'admin'
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 8;

  const [editingUser, setEditingUser] = useState(null); // { _id, name, email, role, avatarUrl }
  const [editForm, setEditForm] = useState({ name: '', email: '', role: '' });
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState('');

  // --- Report detail modal ---
  const [selectedReport, setSelectedReport] = useState(null);
  const [deletingReportIds, setDeletingReportIds] = useState(new Set());

  // --- Fetch all admin data on mount ---
  const fetchAdminData = async () => {
    try {
      setLoading(true);
      setError(null);
      const headers = { Authorization: `Bearer ${localStorage.getItem('token')}` };

      const [statsRes, usersRes, reportsRes] = await Promise.all([
        fetch(`${backendUrl}/api/admin/stats`, { headers }),
        fetch(`${backendUrl}/api/admin/users`, { headers }),
        fetch(`${backendUrl}/api/reports`, { headers }),
      ]);

      if (statsRes.ok) setStats(await statsRes.json());
      else throw new Error('Failed to load stats');
      if (usersRes.ok) setUsers(await usersRes.json());
      else throw new Error('Failed to load users');
      if (reportsRes.ok) setReports(await reportsRes.json());
      else throw new Error('Failed to load reports');
    } catch (err) {
      console.error('Error fetching admin data', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAdminData(); }, [backendUrl]);

  // --- Client‑side filtering & pagination of users ---
  const filteredUsers = useMemo(() => {
    let list = users;
    if (searchTerm.trim()) {
      const lower = searchTerm.toLowerCase();
      list = list.filter(u =>
        (u.name || '').toLowerCase().includes(lower) ||
        (u.email || '').toLowerCase().includes(lower)
      );
    }
    if (roleFilter !== 'all') {
      list = list.filter(u => u.role === roleFilter);
    }
    return list;
  }, [users, searchTerm, roleFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / usersPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages); // reset if out of bounds
  const paginatedUsers = useMemo(() => {
    const start = (safeCurrentPage - 1) * usersPerPage;
    return filteredUsers.slice(start, start + usersPerPage);
  }, [filteredUsers, safeCurrentPage]);

  // Reset to page 1 when filters change
  useEffect(() => { setCurrentPage(1); }, [searchTerm, roleFilter]);

  // --- User actions ---
  const handleDeleteUser = async (id, name) => {
    if (!window.confirm(`Permanently delete user "${name}"? This action cannot be undone.`)) return;
    setDeletingUserIds(prev => new Set(prev).add(id));
    try {
      const res = await fetch(`${backendUrl}/api/admin/users/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        setUsers(prev => prev.filter(u => u._id !== id));
      } else {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Delete failed');
      }
    } catch (err) {
      alert('Failed to delete user: ' + err.message);
    } finally {
      setDeletingUserIds(prev => { const n = new Set(prev); n.delete(id); return n; });
    }
  };

  const openEditModal = (user) => {
    setEditingUser(user);
    setEditForm({ name: user.name || '', email: user.email || '', role: user.role || 'user' });
    setEditError('');
  };

  const handleEditSave = async () => {
    if (!editingUser) return;
    setEditSaving(true);
    setEditError('');
    try {
      const res = await fetch(`${backendUrl}/api/admin/users/${editingUser._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(editForm)
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Update failed');
      // Update local state
      setUsers(prev => prev.map(u => u._id === editingUser._id ? { ...u, ...editForm } : u));
      setEditingUser(null);
    } catch (err) {
      setEditError(err.message);
    } finally {
      setEditSaving(false);
    }
  };

  // --- Report actions ---
  const handleReportStatusChange = async (reportId, newStatus) => {
    const previousStatus = reports.find(r => r._id === reportId)?.status;
    setReportError('');
    setUpdatingReportIds(prev => new Set(prev).add(reportId));
    setReports(prev => prev.map(r => r._id === reportId ? { ...r, status: newStatus } : r));

    try {
      const res = await fetch(`${backendUrl}/api/reports/${reportId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || data.message || 'Status update failed');
    } catch (err) {
      if (previousStatus) {
        setReports(prev => prev.map(r => r._id === reportId ? { ...r, status: previousStatus } : r));
      }
      setReportError(err.message);
    } finally {
      setUpdatingReportIds(prev => { const n = new Set(prev); n.delete(reportId); return n; });
    }
  };

  const openReportDetail = (report) => setSelectedReport(report);

  const handleDeleteReport = async (reportId) => {
    if (!window.confirm('Delete this report permanently?')) return;
    setDeletingReportIds(prev => new Set(prev).add(reportId));
    try {
      const res = await fetch(`${backendUrl}/api/reports/${reportId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (!res.ok) throw new Error('Could not delete report');
      setReports(prev => prev.filter(r => r._id !== reportId));
      if (selectedReport?._id === reportId) setSelectedReport(null);
    } catch (err) {
      setReportError(err.message);
    } finally {
      setDeletingReportIds(prev => { const n = new Set(prev); n.delete(reportId); return n; });
    }
  };

  // --- Render ---
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-gray-500">
        <HiOutlineRefresh className="animate-spin text-4xl mb-4" />
        Loading admin dashboard...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-10 text-center">
        <p className="text-red-500 text-lg font-medium mb-4">Error: {error}</p>
        <button onClick={fetchAdminData} className="px-4 py-2 bg-blush-100 text-blush-700 rounded-xl hover:bg-blush-200 transition">
          Retry
        </button>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-7xl mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold text-gray-800 mb-8 flex items-center gap-2">
        <HiOutlineShieldCheck className="text-blush-500" /> Super Admin Dashboard
      </h1>

      {/* --- Stats --- */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <StatCard title="Total Users" value={stats.userCount} icon={<HiOutlineUsers />} color="bg-blue-50 text-blue-600" />
          <StatCard title="Couples" value={stats.coupleCount} icon={<HiOutlineHeart />} color="bg-pink-50 text-pink-600" />
          <StatCard title="Memories" value={stats.memoryCount} icon={<HiOutlineHeart />} color="bg-orange-50 text-orange-600" />
          <StatCard title="Messages" value={stats.messageCount} icon={<HiOutlineChatAlt2 />} color="bg-green-50 text-green-600" />
        </div>
      )}

      {/* --- Users Section --- */}
      <div className="glass rounded-[2rem] p-6 shadow-sm mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h2 className="text-xl font-bold text-gray-800">All Registered Users</h2>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search name or email..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blush-200 w-48"
              />
            </div>
            <select
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value)}
              className="py-2 px-3 rounded-xl border border-gray-200 text-sm bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-blush-200"
            >
              <option value="all">All roles</option>
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="pb-3 text-sm font-semibold text-gray-500">Name</th>
                <th className="pb-3 text-sm font-semibold text-gray-500">Email</th>
                <th className="pb-3 text-sm font-semibold text-gray-500">Role</th>
                <th className="pb-3 text-sm font-semibold text-gray-500">Joined</th>
                <th className="pb-3 text-sm font-semibold text-gray-500 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedUsers.map(user => (
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
                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="py-4 text-gray-500 text-sm">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEditModal(user)}
                        className="p-2 text-gray-400 hover:text-blush-600 hover:bg-blush-50 rounded-lg transition"
                        title="Edit user"
                      >
                        <HiOutlinePencil className="text-lg" />
                      </button>
                      {user.role !== 'admin' && (
                        <button
                          onClick={() => handleDeleteUser(user._id, user.name || user.email)}
                          disabled={deletingUserIds.has(user._id)}
                          className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
                          title="Delete User"
                        >
                          {deletingUserIds.has(user._id) ? (
                            <HiOutlineRefresh className="animate-spin text-lg" />
                          ) : (
                            <HiOutlineTrash className="text-lg" />
                          )}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {paginatedUsers.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-gray-400">No users found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
            <span className="text-sm text-gray-500">
              Showing {((safeCurrentPage - 1) * usersPerPage) + 1}–{Math.min(safeCurrentPage * usersPerPage, filteredUsers.length)} of {filteredUsers.length}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={safeCurrentPage === 1}
                className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 text-gray-500"
              >
                <HiOutlineChevronLeft />
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={safeCurrentPage === totalPages}
                className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 text-gray-500"
              >
                <HiOutlineChevronRight />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* --- Reports Section --- */}
      <div className="glass rounded-[2rem] p-6 shadow-sm">
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
            {reports.map(report => {
              const statusColors = {
                open: 'bg-red-100 text-red-600',
                'in-review': 'bg-amber-100 text-amber-600',
                resolved: 'bg-green-100 text-green-600',
              };
              const updating = updatingReportIds.has(report._id);
              const deleting = deletingReportIds.has(report._id);
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
                  <div className="flex items-center gap-2 self-end sm:self-start">
                    <button
                      onClick={() => openReportDetail(report)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-blush-600 hover:bg-blush-50 transition"
                      title="View details"
                    >
                      <HiOutlineEye className="text-lg" />
                    </button>
                    <select
                      value={report.status}
                      onChange={e => handleReportStatusChange(report._id, e.target.value)}
                      disabled={updating}
                      className="text-xs px-3 py-1.5 rounded-xl border border-gray-100 bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-blush-200 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <option value="open">Open</option>
                      <option value="in-review">In Review</option>
                      <option value="resolved">Resolved</option>
                    </select>
                    <button
                      onClick={() => handleDeleteReport(report._id)}
                      disabled={deleting}
                      className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition disabled:opacity-50"
                      title="Delete report"
                    >
                      {deleting ? (
                        <HiOutlineRefresh className="animate-spin text-lg" />
                      ) : (
                        <HiOutlineTrash className="text-lg" />
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* --- Edit User Modal --- */}
      <Modal isOpen={!!editingUser} onClose={() => setEditingUser(null)} title="Edit User">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-600">Name</label>
            <input
              type="text"
              value={editForm.name}
              onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
              className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600">Email</label>
            <input
              type="email"
              value={editForm.email}
              onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))}
              className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600">Role</label>
            <select
              value={editForm.role}
              onChange={e => setEditForm(f => ({ ...f, role: e.target.value }))}
              className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200 text-sm bg-white"
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          {editError && <p className="text-red-500 text-sm">{editError}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setEditingUser(null)} className="px-4 py-2 rounded-xl text-sm text-gray-600 hover:bg-gray-100">
              Cancel
            </button>
            <button
              onClick={handleEditSave}
              disabled={editSaving}
              className="px-4 py-2 rounded-xl text-sm bg-blush-500 text-white hover:bg-blush-600 disabled:opacity-60 flex items-center gap-2"
            >
              {editSaving && <HiOutlineRefresh className="animate-spin" />}
              Save Changes
            </button>
          </div>
        </div>
      </Modal>

      {/* --- Report Detail Modal --- */}
      <Modal isOpen={!!selectedReport} onClose={() => setSelectedReport(null)} title="Report Details">
        {selectedReport && (
          <div className="space-y-3">
            <div>
              <span className="text-xs font-semibold text-gray-400 uppercase">Status</span>
              <p className="font-medium capitalize">{selectedReport.status}</p>
            </div>
            <div>
              <span className="text-xs font-semibold text-gray-400 uppercase">Category</span>
              <p className="font-medium capitalize">{selectedReport.category}</p>
            </div>
            <div>
              <span className="text-xs font-semibold text-gray-400 uppercase">Title</span>
              <p className="font-medium">{selectedReport.title}</p>
            </div>
            <div>
              <span className="text-xs font-semibold text-gray-400 uppercase">Description</span>
              <p className="text-gray-700 whitespace-pre-wrap">{selectedReport.description}</p>
            </div>
            <div>
              <span className="text-xs font-semibold text-gray-400 uppercase">Reported by</span>
              <p>{selectedReport.userEmail}</p>
            </div>
            <div>
              <span className="text-xs font-semibold text-gray-400 uppercase">Date</span>
              <p>{new Date(selectedReport.createdAt).toLocaleString()}</p>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => handleDeleteReport(selectedReport._id)}
                className="px-3 py-1.5 rounded-xl text-sm text-red-600 hover:bg-red-50 flex items-center gap-1"
              >
                <HiOutlineTrash /> Delete
              </button>
              <button onClick={() => setSelectedReport(null)} className="px-3 py-1.5 rounded-xl text-sm bg-gray-100 text-gray-600">
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </motion.div>
  );
}

// StatCard remains unchanged
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