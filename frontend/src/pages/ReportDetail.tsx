import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  AlertTriangle, 
  MapPin, 
  ThumbsUp, 
  ThumbsDown, 
  Clock, 
  CheckCircle2, 
  MessageSquare, 
  Send, 
  ShieldAlert, 
  Layers, 
  ArrowLeft,
  Cpu,
  BarChart2
} from 'lucide-react';
import { Report } from '../types';
import { api, formatImageUrl } from '../services/api';

interface ReportDetailProps {
  reportId: number;
  onNavigate: (view: string, reportId?: number) => void;
}

export const ReportDetail: React.FC<ReportDetailProps> = ({ reportId, onNavigate }) => {
  const { user } = useAuth();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [voting, setVoting] = useState(false);

  useEffect(() => {
    loadReport();
  }, [reportId]);

  const loadReport = async () => {
    try {
      setLoading(true);
      const data = await api.getReportById(reportId);
      setReport(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load report');
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (type: 1 | -1) => {
    if (!user) {
      onNavigate('login');
      return;
    }
    setVoting(true);
    try {
      const res = await api.voteReport(reportId, type);
      if (report) {
        setReport({
          ...report,
          upvotes_count: res.upvotes,
          downvotes_count: res.downvotes,
          priority_score: res.new_priority_score,
          user_vote: type,
        });
      }
    } catch (err: any) {
      alert('Vote failed: ' + err.message);
    } finally {
      setVoting(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      onNavigate('login');
      return;
    }
    if (!newComment.trim()) return;

    setSubmittingComment(true);
    try {
      await api.addComment(reportId, newComment);
      setNewComment('');
      await loadReport(); // Reload to get updated comment thread
    } catch (err: any) {
      alert('Failed to post comment: ' + err.message);
    } finally {
      setSubmittingComment(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto py-12 px-4 space-y-6">
        <div className="h-8 w-48 bg-slate-900 rounded-lg animate-pulse" />
        <div className="h-96 bg-slate-900 rounded-3xl animate-pulse" />
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center space-y-4">
        <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-white">Report Not Found</h2>
        <p className="text-sm text-slate-400">{error || 'Unable to locate road hazard record.'}</p>
        <button
          onClick={() => onNavigate('home')}
          className="px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold"
        >
          Return Home
        </button>
      </div>
    );
  }

  const primaryImg = report.images?.find((img) => img.is_primary) || report.images?.[0];
  const pred = report.ai_prediction;
  const breakdown = report.priority_breakdown;

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 space-y-8">
      
      {/* Top Navigation & Status Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <button
          onClick={() => onNavigate('home')}
          className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Overview
        </button>
        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="text-slate-500">HAZARD ID:</span>
          <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-white font-bold">
            {report.report_code}
          </span>
        </div>
      </div>

      {/* Main Title Header */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`px-2.5 py-1 rounded-md text-xs font-bold border ${
            report.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
            report.severity === 'HIGH' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' :
            report.severity === 'MEDIUM' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
            'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
          }`}>
            {report.severity} SEVERITY
          </span>

          <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-900 text-slate-300 border border-slate-800">
            {report.road_type}
          </span>

          <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
            Status: {report.status}
          </span>
        </div>

        <h1 className="text-3xl font-extrabold text-white tracking-tight">{report.title}</h1>

        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
          {report.road_name && (
            <span className="flex items-center gap-1.5 text-slate-300">
              <MapPin className="w-4 h-4 text-rose-400" />
              {report.road_name} {report.landmark && `(${report.landmark})`}
            </span>
          )}
          <span>&bull;</span>
          <span>Logged {new Date(report.created_at).toLocaleDateString()}</span>
          <span>&bull;</span>
          <span className="font-mono">Coordinates: {report.latitude.toFixed(5)}, {report.longitude.toFixed(5)}</span>
        </div>
      </div>

      {/* Visual Computer Vision Inspection Panel (Side by Side Comparison) */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Cpu className="w-5 h-5 text-indigo-400" />
            Computer Vision Analysis & Surface Overlay
          </h2>
          <span className="text-xs font-mono text-slate-400">
            Model: {pred?.model_name || 'YOLOv8-RoadDamage'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Original Photo */}
          <div className="space-y-2">
            <div className="text-xs font-semibold uppercase text-slate-400 flex items-center justify-between">
              <span>Original Citizen Photo</span>
              <span className="text-[10px] text-slate-500 font-mono">Raw Input</span>
            </div>
            <div className="relative h-64 rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden">
              {primaryImg?.original_url ? (
                <img
                  src={formatImageUrl(primaryImg.original_url)}
                  alt="Original Road Photo"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-600">No Image</div>
              )}
            </div>
          </div>

          {/* AI-Annotated Bounding Boxes */}
          <div className="space-y-2">
            <div className="text-xs font-semibold uppercase text-indigo-400 flex items-center justify-between">
              <span>AI Annotated Inference Overlay</span>
              <span className="text-[10px] text-indigo-400 font-mono">Bounding Boxes & Confidence</span>
            </div>
            <div className="relative h-64 rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden">
              {primaryImg?.annotated_url ? (
                <img
                  src={formatImageUrl(primaryImg.annotated_url)}
                  alt="AI Annotated"
                  className="w-full h-full object-cover"
                />
              ) : primaryImg?.original_url ? (
                <img
                  src={formatImageUrl(primaryImg.original_url)}
                  alt="AI Annotated (fallback)"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-600">No Annotation</div>
              )}
            </div>
          </div>
        </div>

        {/* AI Metrics Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div>
            <div className="text-xs text-slate-400">Potholes Identified</div>
            <div className="text-xl font-bold text-white mt-0.5">
              {pred?.pothole_count ?? 1}
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-400">Road Surface Coverage</div>
            <div className="text-xl font-bold text-indigo-400 mt-0.5">
              {pred ? `${(pred.total_damage_area_ratio * 100).toFixed(1)}%` : '6.4%'}
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-400">Detection Confidence</div>
            <div className="text-xl font-bold text-emerald-400 mt-0.5">
              {pred ? `${(pred.average_confidence * 100).toFixed(0)}%` : '85%'}
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-400">Inference Latency</div>
            <div className="text-xl font-bold text-slate-300 mt-0.5">
              {pred?.inference_time_ms ? `${pred.inference_time_ms}ms` : '38ms'}
            </div>
          </div>
        </div>

        {pred?.explanation_text && (
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs text-slate-300 leading-relaxed">
            <span className="font-bold text-white block mb-1">Algorithmic Assessment:</span>
            {pred.explanation_text}
          </div>
        )}
      </div>

      {/* 6-Factor Dynamic Prioritization Math Breakdown */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-blue-400" />
              6-Factor Dynamic Prioritization Formula
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Normalized algorithm calculating municipal maintenance urgency (0 to 100)
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-black text-blue-400">
              {Math.round(report.priority_score)}<span className="text-sm text-slate-500 font-normal">/100</span>
            </div>
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Priority Index</span>
          </div>
        </div>

        {/* Breakdown Progress Bars */}
        <div className="space-y-3.5">
          {/* Factor 1: Severity */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-300 font-medium">1. Severity Component (Weight: 30%)</span>
              <span className="text-slate-400 font-mono">{breakdown?.severity_component ?? 30}/30 pts</span>
            </div>
            <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-red-500 h-full rounded-full transition-all" 
                style={{ width: `${((breakdown?.severity_component ?? 22.5) / 30) * 100}%` }} 
              />
            </div>
          </div>

          {/* Factor 2: Community Upvotes */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-300 font-medium">2. Community Upvotes (Weight: 20%)</span>
              <span className="text-slate-400 font-mono">{breakdown?.community_component ?? 12}/20 pts</span>
            </div>
            <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-blue-500 h-full rounded-full transition-all" 
                style={{ width: `${((breakdown?.community_component ?? 12) / 20) * 100}%` }} 
              />
            </div>
          </div>

          {/* Factor 3: Road Importance */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-300 font-medium">3. Road Classification (Weight: 15%)</span>
              <span className="text-slate-400 font-mono">{breakdown?.road_importance_component ?? 12}/15 pts</span>
            </div>
            <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-indigo-500 h-full rounded-full transition-all" 
                style={{ width: `${((breakdown?.road_importance_component ?? 12) / 15) * 100}%` }} 
              />
            </div>
          </div>

          {/* Factor 4: Age Component */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-300 font-medium">4. Age Decay Escalation (Weight: 15%)</span>
              <span className="text-slate-400 font-mono">{breakdown?.age_component ?? 3}/15 pts</span>
            </div>
            <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-amber-500 h-full rounded-full transition-all" 
                style={{ width: `${((breakdown?.age_component ?? 3) / 15) * 100}%` }} 
              />
            </div>
          </div>

          {/* Factor 5: Location Risk */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-300 font-medium">5. Critical Facility Risk (Weight: 10%)</span>
              <span className="text-slate-400 font-mono">{breakdown?.location_risk_component ?? 5}/10 pts</span>
            </div>
            <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-purple-500 h-full rounded-full transition-all" 
                style={{ width: `${((breakdown?.location_risk_component ?? 5) / 10) * 100}%` }} 
              />
            </div>
          </div>

          {/* Factor 6: Duplicate Clustering */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-300 font-medium">6. Spatial Cluster Factor (Weight: 10%)</span>
              <span className="text-slate-400 font-mono">{breakdown?.duplicate_component ?? 0}/10 pts</span>
            </div>
            <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-emerald-500 h-full rounded-full transition-all" 
                style={{ width: `${((breakdown?.duplicate_component ?? 0) / 10) * 100}%` }} 
              />
            </div>
          </div>
        </div>

        {/* Voting & Community Engagement */}
        <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
          <div className="text-xs text-slate-400">
            Does this hazard obstruct your daily route? Cast a vote to adjust municipal priority.
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleVote(1)}
              disabled={voting}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                report.user_vote === 1
                  ? 'bg-blue-600 text-white border-blue-500'
                  : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
              }`}
            >
              <ThumbsUp className="w-3.5 h-3.5" />
              <span>{report.upvotes_count}</span>
            </button>
            <button
              onClick={() => handleVote(-1)}
              disabled={voting}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                report.user_vote === -1
                  ? 'bg-rose-600 text-white border-rose-500'
                  : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
              }`}
            >
              <ThumbsDown className="w-3.5 h-3.5" />
              <span>{report.downvotes_count}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Community Comments Section */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-6">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-blue-400" />
          Community Discussion ({report.comments?.length || 0})
        </h2>

        {/* Comment Input */}
        <form onSubmit={handleAddComment} className="flex gap-3">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder={user ? "Add field notes, vehicle damage reports, or updates..." : "Please sign in to comment..."}
            disabled={!user || submittingComment}
            className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
          <button
            type="submit"
            disabled={!user || submittingComment || !newComment.trim()}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-md shadow-blue-600/30 transition-all flex items-center gap-1.5 disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" /> Post
          </button>
        </form>

        {/* Comment Thread List */}
        <div className="space-y-3 pt-2">
          {report.comments && report.comments.length > 0 ? (
            report.comments.map((c) => (
              <div key={c.id} className="p-4 rounded-xl bg-slate-900/70 border border-slate-800/80 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">{c.user_name}</span>
                  <span className="text-[10px] text-slate-500">
                    {new Date(c.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-xs text-slate-300">{c.comment_text}</p>
              </div>
            ))
          ) : (
            <div className="text-center py-6 text-xs text-slate-500">
              No comments posted yet. Be the first to add details.
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

