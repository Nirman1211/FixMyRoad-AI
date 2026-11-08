import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  AlertTriangle, 
  Upload, 
  MapPin, 
  Cpu, 
  CheckCircle, 
  ArrowRight, 
  Loader2,
  Sparkles
} from 'lucide-react';
import { MapPicker } from '../components/MapPicker';
import { api } from '../services/api';
import { RoadType } from '../types';

interface ReportProblemProps {
  onNavigate: (view: string, reportId?: number) => void;
}

export const ReportProblem: React.FC<ReportProblemProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [roadName, setRoadName] = useState('');
  const [landmark, setLandmark] = useState('');
  const [roadType, setRoadType] = useState<RoadType>('RESIDENTIAL');
  const [latitude, setLatitude] = useState(40.7128);
  const [longitude, setLongitude] = useState(-74.0060);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Pre-submission AI Scan state
  const [scanning, setScanning] = useState(false);
  const [aiScanResult, setAiScanResult] = useState<any | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setAiScanResult(null); // Reset previous scan
    }
  };

  const handleRunAiScan = async () => {
    if (!selectedFile) return;
    setScanning(true);
    setError(null);
    try {
      const res = await api.scanDamage(selectedFile);
      setAiScanResult(res);
    } catch (err: any) {
      setError('AI preview scan failed: ' + err.message);
    } finally {
      setScanning(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      onNavigate('login');
      return;
    }
    if (!selectedFile) {
      setError('Please provide a road photo to analyze.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('title', title);
      if (description) formData.append('description', description);
      if (roadName) formData.append('road_name', roadName);
      if (landmark) formData.append('landmark', landmark);
      formData.append('road_type', roadType);
      formData.append('latitude', latitude.toString());
      formData.append('longitude', longitude.toString());
      formData.append('image', selectedFile);

      const createdReport = await api.createReport(formData);
      onNavigate('report-detail', createdReport.id);
    } catch (err: any) {
      setError(err.message || 'Failed to submit report.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 space-y-8">
      
      {/* Page Header */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          AI Computer Vision Road Inspection
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Report Road Hazard</h1>
        <p className="text-sm text-slate-400">
          Upload an image of the road crater or defect. Our dual-engine AI will automatically verify the potholes, compute damage ratio, and prioritize municipal repair.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-medium">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* Section 1: Photo & Computer Vision Inspection */}
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Upload className="w-5 h-5 text-blue-400" />
            1. Road Surface Imagery
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            
            {/* File Dropzone */}
            <div className="space-y-4">
              <label className="border-2 border-dashed border-slate-700 hover:border-blue-500 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors bg-slate-900/50 hover:bg-slate-900 min-h-[220px]">
                <Upload className="w-10 h-10 text-slate-500 mb-3" />
                <span className="text-sm font-semibold text-white">Click or drag asphalt photo here</span>
                <span className="text-xs text-slate-500 mt-1">Supports JPG, PNG, WEBP up to 15MB</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>

              {previewUrl && (
                <button
                  type="button"
                  onClick={handleRunAiScan}
                  disabled={scanning}
                  className="w-full py-2.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 font-semibold text-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {scanning ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Analyzing damage contour & texture...
                    </>
                  ) : (
                    <>
                      <Cpu className="w-4 h-4 text-indigo-400" />
                      Pre-scan with Computer Vision
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Image Preview / AI Overlay Preview */}
            <div className="relative min-h-[220px] rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden flex items-center justify-center">
              {aiScanResult?.annotated_image_url ? (
                <div className="relative w-full h-full">
                  <img
                    src={aiScanResult.annotated_image_url}
                    alt="AI Annotated Preview"
                    className="w-full h-full object-cover max-h-[260px]"
                  />
                  <div className="absolute bottom-2 left-2 right-2 bg-slate-950/80 backdrop-blur-md p-2.5 rounded-lg border border-slate-700 text-xs">
                    <div className="font-bold text-white flex items-center justify-between">
                      <span>Detected: {aiScanResult.pothole_count} Potholes</span>
                      <span className="text-amber-400 font-mono">{aiScanResult.visual_severity}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">
                      {aiScanResult.explanation}
                    </p>
                  </div>
                </div>
              ) : previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Selected Preview"
                  className="w-full h-full object-cover max-h-[260px]"
                />
              ) : (
                <div className="text-center p-6 text-slate-600">
                  <AlertTriangle className="w-10 h-10 mx-auto mb-2 opacity-40" />
                  <p className="text-xs">No image selected</p>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Section 2: Hazard Details */}
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            2. Hazard Description & Classification
          </h2>

          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase text-slate-400">Report Headline *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Severe deep pothole cluster causing vehicle swerves"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase text-slate-400">Road / Street Name</label>
                <input
                  type="text"
                  value={roadName}
                  onChange={(e) => setRoadName(e.target.value)}
                  placeholder="e.g. Interstate Route 95 North"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase text-slate-400">Road Classification *</label>
                <select
                  value={roadType}
                  onChange={(e) => setRoadType(e.target.value as RoadType)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="HIGHWAY">Highway / Expressway (High Speed & Traffic)</option>
                  <option value="PRIMARY">Primary / Arterial Corridor</option>
                  <option value="SECONDARY">Secondary / Collector Street</option>
                  <option value="RESIDENTIAL">Residential / Local Street</option>
                  <option value="RURAL">Rural / Unpaved Route</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase text-slate-400">Prominent Landmark / Cross Street</label>
              <input
                type="text"
                value={landmark}
                onChange={(e) => setLandmark(e.target.value)}
                placeholder="e.g. Opposite St. Jude High School, near Exit 24"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase text-slate-400">Additional Context (Optional)</label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe weather, water accumulation, damage to tires, or traffic obstructions..."
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-4 text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Geographic Coordinates */}
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <MapPin className="w-5 h-5 text-rose-400" />
            3. Pinpoint Geolocation
          </h2>

          <MapPicker
            latitude={latitude}
            longitude={longitude}
            onChange={(lat, lon) => {
              setLatitude(lat);
              setLongitude(lon);
            }}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-4 pt-4">
          <button
            type="button"
            onClick={() => onNavigate('home')}
            className="px-6 py-3 rounded-xl border border-slate-800 hover:bg-slate-900 text-slate-300 font-medium text-sm transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-xl shadow-blue-600/30 transition-all hover:scale-[1.02] disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Analyzing & Dispatching...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 text-emerald-300" />
                Submit Road Hazard Report
                <ArrowRight className="w-4 h-4 ml-1" />
              </>
            )}
          </button>
        </div>

      </form>
    </div>
  );
};

