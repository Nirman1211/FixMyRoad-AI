import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Wrench, 
  Clock, 
  CheckCircle2, 
  MapPin, 
  Upload, 
  AlertTriangle,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';
import { MaintenanceAssignment } from '../types';
import { api } from '../services/api';

interface OfficerDashboardProps {
  onNavigate: (view: string, reportId?: number) => void;
}

export const OfficerDashboard: React.FC<OfficerDashboardProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<MaintenanceAssignment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [completingId, setCompletingId] = useState<number | null>(null);

  // Completion Form Fields
  const [repairNotes, setRepairNotes] = useState('');
  const [materialsUsed, setMaterialsUsed] = useState('');
  const [costEstimate, setCostEstimate] = useState<number>(250);
  const [completionPhoto, setCompletionPhoto] = useState<File | null>(null);
  const [submittingRepair, setSubmittingRepair] = useState(false);

  useEffect(() => {
    loadAssignments();
  }, []);

  const loadAssignments = async () => {
    try {
      setLoading(true);
      const data = await api.getOfficerAssignments();
      setAssignments(data);
    } catch (err) {
      console.error('Failed to load assignments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteWorkOrder = async (e: React.FormEvent, assignmentId: number) => {
    e.preventDefault();
    setSubmittingRepair(true);
    try {
      const formData = new FormData();
      formData.append('repair_notes', repairNotes);
      if (materialsUsed) formData.append('materials_used', materialsUsed);
      if (costEstimate) formData.append('cost_estimate', costEstimate.toString());
      if (completionPhoto) formData.append('completion_image', completionPhoto);

      await api.completeRepair(assignmentId, formData);
      setCompletingId(null);
      setRepairNotes('');
      setMaterialsUsed('');
      setCompletionPhoto(null);
      await loadAssignments();
    } catch (err: any) {
      alert('Repair submission failed: ' + err.message);
    } finally {
      setSubmittingRepair(false);
    }
  };

  if (user?.role !== 'OFFICER' && user?.role !== 'ADMIN') {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <Wrench className="w-12 h-12 text-amber-500 mx-auto" />
        <h2 className="text-xl font-bold text-white">Technician Access Required</h2>
        <p className="text-sm text-slate-400">Please sign in as a Field Maintenance Officer.</p>
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
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 space-y-8">
      
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-semibold mb-2">
          <Wrench className="w-3.5 h-3.5" />
          Field Maintenance Crew Workspace
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Assigned Work Orders</h1>
        <p className="text-xs text-slate-400 mt-1">
          Perform road patch repairs, document materials used, and capture verification photos to close out hazards.
        </p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-32 rounded-2xl bg-slate-900 border border-slate-800 animate-pulse" />
          ))}
        </div>
      ) : assignments.length === 0 ? (
        <div className="glass-panel p-12 rounded-3xl border border-slate-800 text-center space-y-4">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
          <h3 className="text-lg font-bold text-white">All Clear! No Pending Work Orders</h3>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            You currently have no active work orders assigned. New dispatches from municipal admins will appear here automatically.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {assignments.map((asgn) => {
            const rep = asgn.report;
            return (
              <div
                key={asgn.id}
                className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4 shadow-xl"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs font-mono">
                      <span className="text-amber-400 font-bold">WORK ORDER #{asgn.id}</span>
                      <span>&bull;</span>
                      <span className="text-slate-400">{rep?.report_code}</span>
                      <span>&bull;</span>
                      <span className="text-slate-400">{rep?.road_type}</span>
                    </div>
                    <h3 className="text-lg font-bold text-white">{rep?.title}</h3>
                    {rep?.road_name && (
                      <p className="text-xs text-slate-400 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                        <span>{rep.road_name} ({rep.landmark})</span>
                      </p>
                    )}
                  </div>

                  <div className="text-right">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                      asgn.status === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-400' :
                      asgn.status === 'IN_PROGRESS' ? 'bg-amber-500/20 text-amber-400' :
                      'bg-blue-500/20 text-blue-400'
                    }`}>
                      {asgn.status}
                    </span>
                    <div className="text-[11px] text-slate-500 mt-1">
                      Assigned: {new Date(asgn.assigned_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                {asgn.instructions && (
                  <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 text-xs text-slate-300">
                    <strong className="text-white block mb-0.5">Dispatch Instructions:</strong>
                    {asgn.instructions}
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                  <button
                    onClick={() => onNavigate('report-detail', rep?.id)}
                    className="text-xs font-semibold text-blue-400 hover:text-blue-300"
                  >
                    View Original Report & AI Scans &rarr;
                  </button>

                  {asgn.status !== 'COMPLETED' && (
                    <button
                      onClick={() => setCompletingId(completingId === asgn.id ? null : asgn.id)}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-emerald-600/30 transition-all"
                    >
                      {completingId === asgn.id ? 'Cancel' : 'Log Repair Completion'}
                    </button>
                  )}
                </div>

                {/* Repair Completion Form */}
                {completingId === asgn.id && (
                  <form onSubmit={(e) => handleCompleteWorkOrder(e, asgn.id)} className="p-5 bg-slate-900/90 rounded-2xl border border-emerald-500/30 space-y-4 mt-4">
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      Sign Off Repair Completion
                    </h4>

                    <div className="space-y-1">
                      <label className="text-xs text-slate-400 uppercase font-semibold">Repair Notes *</label>
                      <textarea
                        required
                        rows={2}
                        value={repairNotes}
                        onChange={(e) => setRepairNotes(e.target.value)}
                        placeholder="Excavated fractured crater, applied hot-mix asphalt sealant and compacted flush..."
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs text-slate-400 uppercase font-semibold">Materials Used</label>
                        <input
                          type="text"
                          value={materialsUsed}
                          onChange={(e) => setMaterialsUsed(e.target.value)}
                          placeholder="e.g. 50kg Hot Asphalt Mix, Tack Coat Emulsion"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs text-slate-400 uppercase font-semibold">Estimated Cost (USD)</label>
                        <input
                          type="number"
                          value={costEstimate}
                          onChange={(e) => setCostEstimate(Number(e.target.value))}
                          placeholder="250"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs text-slate-400 uppercase font-semibold">Verification Completion Photo</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            setCompletionPhoto(e.target.files[0]);
                          }
                        }}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-400 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-slate-300"
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setCompletingId(null)}
                        className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={submittingRepair}
                        className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-emerald-600/30 transition-all disabled:opacity-50"
                      >
                        {submittingRepair ? 'Submitting...' : 'Confirm & Close Work Order'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

