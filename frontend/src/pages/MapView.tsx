import React, { useEffect, useState } from 'react';
import { 
  Map as MapIcon, 
  Layers, 
  Filter, 
  AlertTriangle, 
  Compass, 
  Activity,
  Crosshair
} from 'lucide-react';
import { DamageHeatmap } from '../components/DamageHeatmap';
import { MapReportPoint, HotspotCluster, DamageSeverity, RoadType } from '../types';
import { api } from '../services/api';

interface MapViewProps {
  onNavigate: (view: string, reportId?: number) => void;
}

export const MapView: React.FC<MapViewProps> = ({ onNavigate }) => {
  const [reports, setReports] = useState<MapReportPoint[]>([]);
  const [clusters, setClusters] = useState<HotspotCluster[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');
  const [selectedRoadType, setSelectedRoadType] = useState<string>('ALL');
  const [showClusters, setShowClusters] = useState<boolean>(true);

  useEffect(() => {
    loadMapData();
  }, []);

  const loadMapData = async () => {
    try {
      setLoading(true);
      const [pts, clusts] = await Promise.all([
        api.getMapPoints(),
        api.getClusters(),
      ]);
      setReports(pts);
      setClusters(clusts);
    } catch (err) {
      console.error('Failed to load map data:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredReports = reports.filter((rep) => {
    if (selectedSeverity !== 'ALL' && rep.severity !== selectedSeverity) return false;
    if (selectedRoadType !== 'ALL' && rep.road_type !== selectedRoadType) return false;
    return true;
  });

  return (
    <div className="h-[calc(100vh-5rem)] flex flex-col space-y-4 pb-4">
      
      {/* Top Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 glass-panel px-4 py-3 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <MapIcon className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white">Geospatial Intelligence Map</h1>
            <p className="text-[11px] text-slate-400">
              Visualizing {filteredReports.length} road damage points across municipal corridors
            </p>
          </div>
        </div>

        {/* Filter dropdowns & toggles */}
        <div className="flex flex-wrap items-center gap-2">
          
          {/* Severity Filter */}
          <select
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">Critical Only</option>
            <option value="HIGH">High Only</option>
            <option value="MEDIUM">Medium Only</option>
            <option value="LOW">Low Only</option>
          </select>

          {/* Road Type Filter */}
          <select
            value={selectedRoadType}
            onChange={(e) => setSelectedRoadType(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
          >
            <option value="ALL">All Road Classes</option>
            <option value="HIGHWAY">Highway</option>
            <option value="PRIMARY">Primary / Arterial</option>
            <option value="SECONDARY">Secondary</option>
            <option value="RESIDENTIAL">Residential</option>
          </select>

          {/* Toggle Corridors */}
          <button
            onClick={() => setShowClusters(!showClusters)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors flex items-center gap-1.5 ${
              showClusters
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            DBSCAN Hotspots ({clusters.length})
          </button>
        </div>
      </div>

      {/* Main Interactive Map Canvas */}
      <div className="flex-1 w-full rounded-2xl overflow-hidden border border-slate-800 relative shadow-2xl">
        {loading ? (
          <div className="w-full h-full bg-slate-900 flex items-center justify-center text-slate-500">
            Loading Geospatial Layers...
          </div>
        ) : (
          <DamageHeatmap
            reports={filteredReports}
            clusters={showClusters ? clusters : []}
            onSelectReport={(id) => onNavigate('report-detail', id)}
          />
        )}
      </div>

    </div>
  );
};

