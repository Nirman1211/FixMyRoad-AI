import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { MapReportPoint, HotspotCluster } from '../types';

interface DamageHeatmapProps {
  reports: MapReportPoint[];
  clusters?: HotspotCluster[];
  onSelectReport?: (id: number) => void;
  center?: [number, number];
  zoom?: number;
}

export const DamageHeatmap: React.FC<DamageHeatmapProps> = ({
  reports,
  clusters = [],
  onSelectReport,
  center = [40.7128, -74.0060],
  zoom = 13,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center,
        zoom,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; CARTO &copy; OpenStreetMap',
        maxZoom: 19,
      }).addTo(map);

      const layerGroup = L.layerGroup().addTo(map);
      layerGroupRef.current = layerGroup;
      mapInstanceRef.current = map;
    }

    return () => {
      // Map cleanup if unmounted
    };
  }, []);

  // Update markers when reports or clusters change
  useEffect(() => {
    if (!layerGroupRef.current || !mapInstanceRef.current) return;

    layerGroupRef.current.clearLayers();

    // 1. Draw DBSCAN Hotspot Corridor Clusters as translucent circles
    clusters.forEach((cluster) => {
      const circle = L.circle([cluster.center_lat, cluster.center_lon], {
        color: '#ef4444',
        fillColor: '#ef4444',
        fillOpacity: 0.18,
        radius: 350, // 350 meter cluster corridor
        weight: 1.5,
        dashArray: '4, 4',
      });
      circle.bindTooltip(
        `<div style="font-size:12px; font-weight:bold; color:#f87171;">
           ${cluster.corridor_name} (${cluster.point_count} Hazards)
         </div>`,
        { permanent: false, direction: 'top' }
      );
      layerGroupRef.current?.addLayer(circle);
    });

    // 2. Color mapping based on damage severity
    const getSeverityColor = (severity: string) => {
      switch (severity) {
        case 'CRITICAL':
          return { bg: '#dc2626', border: '#ef4444' }; // Crimson
        case 'HIGH':
          return { bg: '#ea580c', border: '#f97316' }; // Amber Orange
        case 'MEDIUM':
          return { bg: '#eab308', border: '#facc15' }; // Gold Yellow
        default:
          return { bg: '#16a34a', border: '#22c55e' }; // Forest Green
      }
    };

    // 3. Add Point Markers
    reports.forEach((rep) => {
      const { bg, border } = getSeverityColor(rep.severity);

      const markerHtml = `
        <div style="
          background-color: ${bg};
          border: 2px solid ${border};
          width: 26px;
          height: 26px;
          border-radius: 50%;
          box-shadow: 0 0 10px ${bg}88;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 11px;
          font-weight: bold;
          cursor: pointer;
        ">
          ${rep.priority_score > 0 ? Math.round(rep.priority_score) : '!'}
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'severity-point-icon',
        html: markerHtml,
        iconSize: [26, 26],
        iconAnchor: [13, 13],
      });

      const marker = L.marker([rep.latitude, rep.longitude], { icon: customIcon });

      const popupContent = `
        <div style="min-width: 200px; padding: 4px;">
          <div style="font-size: 10px; font-weight: 700; color: #94a3b8; text-transform: uppercase;">
            ${rep.report_code} &bull; ${rep.road_type}
          </div>
          <div style="font-size: 14px; font-weight: 700; color: #ffffff; margin: 4px 0;">
            ${rep.title}
          </div>
          <div style="display: flex; gap: 6px; align-items: center; margin-top: 6px;">
            <span style="
              font-size: 10px; 
              font-weight: 600; 
              padding: 2px 6px; 
              border-radius: 4px; 
              background: ${bg}33; 
              color: ${border}; 
              border: 1px solid ${border}66;
            ">
              ${rep.severity}
            </span>
            <span style="font-size: 11px; color: #cbd5e1;">
              Priority: <strong>${Math.round(rep.priority_score)}/100</strong>
            </span>
          </div>
          <button 
            id="view-rep-${rep.id}" 
            style="
              margin-top: 10px; 
              width: 100%; 
              background: #2563eb; 
              color: white; 
              border: none; 
              padding: 6px 10px; 
              border-radius: 6px; 
              font-size: 12px; 
              font-weight: 600; 
              cursor: pointer;
            "
          >
            Inspect Details &rarr;
          </button>
        </div>
      `;

      marker.bindPopup(popupContent);

      marker.on('popupopen', () => {
        const btn = document.getElementById(`view-rep-${rep.id}`);
        if (btn) {
          btn.onclick = () => {
            if (onSelectReport) onSelectReport(rep.id);
          };
        }
      });

      layerGroupRef.current?.addLayer(marker);
    });

    // Fit bounds if we have points
    if (reports.length > 0 && mapInstanceRef.current) {
      const bounds = L.latLngBounds(reports.map((r) => [r.latitude, r.longitude]));
      mapInstanceRef.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
    }
  }, [reports, clusters]);

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden border border-slate-800 shadow-xl bg-slate-900">
      <div ref={mapContainerRef} className="w-full h-full" />
    </div>
  );
};

