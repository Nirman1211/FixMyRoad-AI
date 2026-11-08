import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  AlertTriangle, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  PlusCircle, 
  ExternalLink,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import { Report } from '../types';
import { api, formatImageUrl } from '../services/api';

interface MyReportsProps {
  onNavigate: (view: string, reportId?: number) => void;
}

export const MyReports: React.FC<MyReportsProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadMyReports();
    }
  }, [user]);

  const loadMyReports = async () => {
    try {
      setLoading(true);
      const data = await api.getMyReports();
      setReports(data);
    } catch (err) {
      console.error('Failed to load my reports:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto" />
        <h2 className="text-xl font-bold text-white">Sign In Required</h2>
        <p className="text-sm text-slate-400">Please sign in to view your logged reports.</p>
        <button
          onClick={() => onNavigate('login')}
          className="px-6 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold"
        >
          Go to Sign In
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 space-y-6">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">My Hazard Reports</h1>
          <p className="text-xs text-slate-400 mt-1">
            Track real-time municipal status and repair progress for road defects you submitted.
          </p>
        </div>
        <button
          onClick={() => onNavigate('report')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-600/30 transition-all"
        >
          <PlusCircle className="w-4 h-4" />
          Report Another Hazard
        </button>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-28 rounded-2xl bg-slate-900 border border-slate-800 animate-pulse" />
          ))}
        </div>
      ) : reports.length === 0 ? (
        <div className="glass-panel p-12 rounded-3xl border border-slate-800 text-center space-y-4">
          <AlertTriangle className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-lg font-bold text-white">No Reports Submitted Yet</h3>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            You haven't logged any road hazards yet. Help your local city council by taking a photo of cracks or potholes in your neighborhood.
          </p>
          <button
            onClick={() => onNavigate('report')}
            className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-semibold"
          >
            Submit First Report
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((rep) => {
            const primaryImg = rep.images?.find((img) => img.is_primary) || rep.images?.[0];
            const displayImg = formatImageUrl(primaryImg?.annotated_url || primaryImg?.original_url);

            return (
              <div
                key={rep.id}
                onClick={() => onNavigate('report-detail', rep.id)}
                className="glass-panel-hover glass-panel p-5 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-xl bg-slate-900 overflow-hidden shrink-0 border border-slate-800">
                    {displayImg ? (
                      <img src={displayImg} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-600">
                        <AlertTriangle className="w-6 h-6" />
                      </div>
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
                      <span>{rep.report_code}</span>
                      <span>&bull;</span>
                      <span>{rep.road_type}</span>
                    </div>

                    <h3 className="text-base font-bold text-white line-clamp-1">{rep.title}</h3>

                    {rep.road_name && (
                      <div className="text-xs text-slate-400 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-rose-400" />
                        <span>{rep.road_name}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-2 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-800">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Priority Score</span>
                    <div className="text-lg font-black text-blue-400">{Math.round(rep.priority_score)}/100</div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                      rep.status === 'RESOLVED' ? 'bg-emerald-500/20 text-emerald-400' :
                      rep.status === 'IN_PROGRESS' ? 'bg-amber-500/20 text-amber-400' :
                      rep.status === 'VERIFIED' ? 'bg-blue-500/20 text-blue-400' :
                      'bg-slate-800 text-slate-300'
                    }`}>
                      {rep.status}
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-500" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

