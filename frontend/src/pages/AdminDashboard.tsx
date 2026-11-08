import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  ShieldAlert, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  UserPlus, 
  AlertTriangle, 
  ExternalLink,
  ChevronDown
} from 'lucide-react';
import { Report, User, ReportStatus } from '../types';
import { api } from '../services/api';

interface AdminDashboardProps {
  onNavigate: (view: string, reportId?: number) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [officers, setOfficers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [assigningId, setAssigningId] = useState<number | null>(null);
  const [selectedOfficer, setSelectedOfficer] = useState<number>(0);
  const [instructions, setInstructions] = useState<string>('');

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    try {
      setLoading(true);
      const [reps, offs] = await Promise.all([
        api.getReports({ limit: 50 }),
        api.getOfficers(),
      ]);
      setReports(reps);
      setOfficers(offs);
      if (offs.length > 0) setSelectedOfficer(offs[0].id);
    } catch (err) {
      console.error('Failed to load admin dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (reportId: number, newStatus: ReportStatus) => {
    try {
      await api.updateReportStatus(reportId, newStatus);
      await loadAdminData();
    } catch (err: any) {
      alert('Status update failed: ' + err.message);
    }
  };

  const handleAssign = async (reportId: number) => {
    if (!selectedOfficer) return;
    try {
      await api.assignReport(reportId, selectedOfficer, instructions);
      setAssigningId(null);
      setInstructions('');
      await loadAdminData();
    } catch (err: any) {
      alert('Assignment failed: ' + err.message);
    }
  };

  if (user?.role !== 'ADMIN') {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-white">Administrator Access Only</h2>
        <p className="text-sm text-slate-400">Please sign in with an Administrator profile to access dispatch.</p>
        <button
          onClick={() => onNavigate('home')}
          className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-semibold"
        >
          Return to Overview
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 space-y-8">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 text-xs font-semibold mb-2">
            <ShieldAlert className="w-3.5 h-3.5" />
            Municipal Dispatch & Field Operations
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Admin Dispatch Center</h1>
          <p className="text-xs text-slate-400 mt-1">
            Review algorithmic priorities, assign work orders to field technicians, and update status lifecycle.
          </p>
        </div>
      </div>

      {/* Reports Table / Card List */}
      <div className="glass-panel rounded-3xl border border-slate-800 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-900/80 text-[11px] uppercase tracking-wider font-semibold text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-6 py-4">Report & Code</th>
                <th className="px-6 py-4">Severity & Road</th>
                <th className="px-6 py-4">Priority Index</th>
                <th className="px-6 py-4">Current Status</th>
                <th className="px-6 py-4 text-right">Dispatch Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    Loading municipal work orders...
                  </td>
                </tr>
              ) : reports.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    No active hazard reports found.
                  </td>
                </tr>
              ) : (
                reports.map((rep) => (
                  <tr key={rep.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-mono text-xs font-bold text-blue-400">{rep.report_code}</div>
                      <div className="font-bold text-white text-sm line-clamp-1">{rep.title}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{rep.road_name || 'No road specified'}</div>
                    </td>

                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border inline-block ${
                        rep.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                        rep.severity === 'HIGH' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' :
                        rep.severity === 'MEDIUM' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                        'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                      }`}>
                        {rep.severity}
                      </span>
                      <div className="text-xs text-slate-400 mt-1">{rep.road_type}</div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="font-black text-base text-white">
                        {Math.round(rep.priority_score)}
                        <span className="text-xs font-normal text-slate-500">/100</span>
                      </div>
                      <div className="text-[10px] text-slate-500">{rep.upvotes_count} upvotes</div>
                    </td>

                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-md text-xs font-semibold ${
                        rep.status === 'RESOLVED' ? 'bg-emerald-500/20 text-emerald-400' :
                        rep.status === 'IN_PROGRESS' ? 'bg-amber-500/20 text-amber-400' :
                        rep.status === 'VERIFIED' ? 'bg-blue-500/20 text-blue-400' :
                        'bg-slate-800 text-slate-300'
                      }`}>
                        {rep.status}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-right space-y-2">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onNavigate('report-detail', rep.id)}
                          className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-medium border border-slate-800"
                        >
                          View
                        </button>

                        <button
                          onClick={() => handleStatusChange(rep.id, 'VERIFIED')}
                          className="px-2.5 py-1 rounded bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 text-xs font-medium border border-blue-500/30"
                        >
                          Verify
                        </button>

                        <button
                          onClick={() => setAssigningId(assigningId === rep.id ? null : rep.id)}
                          className="px-2.5 py-1 rounded bg-amber-600/20 hover:bg-amber-600/30 text-amber-400 text-xs font-medium border border-amber-500/30 flex items-center gap-1"
                        >
                          <UserPlus className="w-3 h-3" /> Assign
                        </button>

                        <button
                          onClick={() => handleStatusChange(rep.id, 'RESOLVED')}
                          className="px-2.5 py-1 rounded bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 text-xs font-medium border border-emerald-500/30"
                        >
                          Resolve
                        </button>
                      </div>

                      {/* Inline Assign Drawer */}
                      {assigningId === rep.id && (
                        <div className="p-3 bg-slate-900 rounded-xl border border-slate-700 text-left space-y-2 mt-2">
                          <div className="text-xs font-semibold text-white">Assign Technician</div>
                          <select
                            value={selectedOfficer}
                            onChange={(e) => setSelectedOfficer(Number(e.target.value))}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
                          >
                            {officers.map((off) => (
                              <option key={off.id} value={off.id}>
                                {off.first_name} {off.last_name} ({off.email})
                              </option>
                            ))}
                          </select>
                          <input
                            type="text"
                            value={instructions}
                            onChange={(e) => setInstructions(e.target.value)}
                            placeholder="Special equipment or repair instructions..."
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
                          />
                          <div className="flex justify-end gap-2 pt-1">
                            <button
                              onClick={() => setAssigningId(null)}
                              className="px-2 py-1 text-xs text-slate-400 hover:text-white"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleAssign(rep.id)}
                              className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-md text-xs font-semibold"
                            >
                              Confirm Work Order
                            </button>
                          </div>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

