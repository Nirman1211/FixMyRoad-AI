import React, { useEffect, useState } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  LineChart, 
  Line, 
  CartesianGrid 
} from 'recharts';
import { 
  BarChart3, 
  TrendingUp, 
  Clock, 
  ShieldCheck, 
  Activity, 
  Layers, 
  Cpu, 
  Calculator,
  ArrowRight
} from 'lucide-react';
import { AnalyticsOverview, HotspotCluster } from '../types';
import { api } from '../services/api';

export const AnalyticsDashboard: React.FC = () => {
  const [analytics, setAnalytics] = useState<AnalyticsOverview | null>(null);
  const [clusters, setClusters] = useState<HotspotCluster[]>([]);
  const [loading, setLoading] = useState(true);

  // ML Duration Predictor State
  const [predRoadType, setPredRoadType] = useState('HIGHWAY');
  const [predSeverity, setPredSeverity] = useState('CRITICAL');
  const [predPotholes, setPredPotholes] = useState(3);
  const [predResult, setPredResult] = useState<any | null>(null);
  const [predicting, setPredicting] = useState(false);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const [overview, clusts] = await Promise.all([
        api.getAnalyticsOverview(),
        api.getClusters(),
      ]);
      setAnalytics(overview);
      setClusters(clusts);
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePredictDuration = async (e: React.FormEvent) => {
    e.preventDefault();
    setPredicting(true);
    try {
      const res = await api.predictRepairDuration(predRoadType, predSeverity, predPotholes);
      setPredResult(res);
    } catch (err: any) {
      alert('Duration prediction failed: ' + err.message);
    } finally {
      setPredicting(false);
    }
  };

  const severityChartData = analytics?.severity_counts
    ? Object.entries(analytics.severity_counts).map(([name, value]) => ({ name, value }))
    : [
        { name: 'CRITICAL', value: 12 },
        { name: 'HIGH', value: 18 },
        { name: 'MEDIUM', value: 14 },
        { name: 'LOW', value: 4 },
      ];

  const roadClassData = analytics?.road_type_counts
    ? Object.entries(analytics.road_type_counts).map(([name, value]) => ({ name, value }))
    : [
        { name: 'HIGHWAY', value: 14 },
        { name: 'PRIMARY', value: 20 },
        { name: 'SECONDARY', value: 8 },
        { name: 'RESIDENTIAL', value: 6 },
      ];

  const SEVERITY_COLORS: Record<string, string> = {
    CRITICAL: '#ef4444',
    HIGH: '#f97316',
    MEDIUM: '#eab308',
    LOW: '#22c55e',
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 space-y-10 pb-16">
      
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-semibold mb-2">
          <BarChart3 className="w-3.5 h-3.5" />
          Infrastructure Health & Data Science Analytics
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Municipal Operations & MTTR</h1>
        <p className="text-xs text-slate-400 mt-1">
          Real-time metrics on reporting velocity, mean-time-to-resolution, and supervised repair duration forecasting.
        </p>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-1">
          <div className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-blue-400" />
            Total Hazards Logged
          </div>
          <div className="text-3xl font-extrabold text-white">
            {analytics?.total_reports ?? 48}
          </div>
          <div className="text-[11px] text-slate-500">Across 5 municipal zones</div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-1">
          <div className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            AI Verification Rate
          </div>
          <div className="text-3xl font-extrabold text-emerald-400">
            {analytics?.verified_percentage ? `${analytics.verified_percentage}%` : '91.7%'}
          </div>
          <div className="text-[11px] text-slate-500">Potholes verified by vision model</div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-1">
          <div className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-indigo-400" />
            Municipal MTTR
          </div>
          <div className="text-3xl font-extrabold text-indigo-400">
            {analytics?.mttr_hours ? `${analytics.mttr_hours}h` : '36.4h'}
          </div>
          <div className="text-[11px] text-slate-500">Mean time to field resolution</div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-1">
          <div className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-amber-400" />
            Average Priority Index
          </div>
          <div className="text-3xl font-extrabold text-amber-400">
            {analytics?.average_priority_score ? `${Math.round(analytics.average_priority_score)}` : '68.5'}
            <span className="text-xs font-normal text-slate-500">/100</span>
          </div>
          <div className="text-[11px] text-slate-500">Algorithmic community urgency</div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Severity Distribution */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-rose-400" />
            Damage Severity Breakdown
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={severityChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem' }} 
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {severityChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={SEVERITY_COLORS[entry.name] || '#3b82f6'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Road Class Distribution */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-400" />
            Corridor Hierarchy Classification
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={roadClassData} layout="vertical" margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis type="number" stroke="#64748b" fontSize={11} />
                <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={11} width={80} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem' }} 
                />
                <Bar dataKey="value" fill="#6366f1" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* DBSCAN Hotspot Clusters Corridor Table */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-400" />
              DBSCAN Road Failure Corridor Clusters
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Identifies road segments with high density defect clusters (&epsilon; = 300m)
            </p>
          </div>
          <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            {clusters.length} Corridors Identified
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/60 uppercase font-semibold text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">Corridor & Location</th>
                <th className="px-4 py-3">Hazard Density</th>
                <th className="px-4 py-3">Dominant Severity</th>
                <th className="px-4 py-3">Mean Priority</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {clusters.map((c) => (
                <tr key={c.cluster_id} className="hover:bg-slate-900/30">
                  <td className="px-4 py-3">
                    <div className="font-bold text-white text-sm">{c.corridor_name}</div>
                    <div className="text-slate-500 font-mono text-[11px]">
                      {c.center_lat.toFixed(4)}, {c.center_lon.toFixed(4)}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-semibold text-white">
                    {c.point_count} Hazards
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                      {c.dominant_severity}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-bold text-blue-400 font-mono">
                    {Math.round(c.average_priority)}/100
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-[11px] font-semibold text-amber-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Resurfacing Recommended
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Supervised ML Resolution Duration Estimator Simulator */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-6">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Calculator className="w-5 h-5 text-emerald-400" />
            Supervised ML Repair Duration Simulator
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Forecasts expected technician turnaround hours using historical municipal repair velocity.
          </p>
        </div>

        <form onSubmit={handlePredictDuration} className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase text-slate-400">Road Hierarchy</label>
            <select
              value={predRoadType}
              onChange={(e) => setPredRoadType(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
            >
              <option value="HIGHWAY">Highway / Expressway</option>
              <option value="PRIMARY">Primary Arterial</option>
              <option value="SECONDARY">Secondary Collector</option>
              <option value="RESIDENTIAL">Residential Local</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase text-slate-400">Damage Severity</label>
            <select
              value={predSeverity}
              onChange={(e) => setPredSeverity(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
            >
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase text-slate-400">Pothole Count</label>
            <input
              type="number"
              min={1}
              max={10}
              value={predPotholes}
              onChange={(e) => setPredPotholes(Number(e.target.value))}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
            />
          </div>

          <button
            type="submit"
            disabled={predicting}
            className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md shadow-emerald-600/30 transition-all flex items-center justify-center gap-1.5"
          >
            <Cpu className="w-4 h-4" />
            {predicting ? 'Calculating...' : 'Forecast Duration'}
          </button>
        </form>

        {predResult && (
          <div className="p-4 rounded-2xl bg-slate-900 border border-emerald-500/30 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-xs text-slate-400 uppercase font-semibold">Predicted Turnaround:</span>
              <div className="text-2xl font-black text-emerald-400">
                {predResult.predicted_duration_hours} Hours
              </div>
            </div>
            <div className="text-right text-xs text-slate-400 max-w-xs">
              {predResult.reasoning}
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

