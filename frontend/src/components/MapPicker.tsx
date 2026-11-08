import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { Crosshair, MapPin } from 'lucide-react';

interface MapPickerProps {
  latitude: number;
  longitude: number;
  onChange: (lat: number, lon: number) => void;
}

export const MapPicker: React.FC<MapPickerProps> = ({ latitude, longitude, onChange }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [latitude, longitude],
        zoom: 14,
        zoomControl: true,
      });

      // Dark Matter Map Tiles
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
        maxZoom: 19,
      }).addTo(map);

      // Custom Pin Icon
      const customIcon = L.divIcon({
        className: 'custom-pin-icon',
        html: `
          <div style="
            background: linear-gradient(135deg, #ef4444, #dc2626);
            width: 32px;
            height: 32px;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 12px rgba(239, 68, 68, 0.5);
            border: 2px solid white;
          ">
            <div style="
              width: 10px;
              height: 10px;
              background: white;
              border-radius: 50%;
              transform: rotate(45deg);
            "></div>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
      });

      const marker = L.marker([latitude, longitude], {
        draggable: true,
        icon: customIcon,
      }).addTo(map);

      marker.on('dragend', () => {
        const pos = marker.getLatLng();
        onChange(parseFloat(pos.lat.toFixed(6)), parseFloat(pos.lng.toFixed(6)));
      });

      map.on('click', (e) => {
        marker.setLatLng(e.latlng);
        onChange(parseFloat(e.latlng.lat.toFixed(6)), parseFloat(e.latlng.lng.toFixed(6)));
      });

      mapInstanceRef.current = map;
      markerRef.current = marker;
    }

    return () => {
      // Map instance preserved or cleaned on unmount
    };
  }, []);

  // Update marker position if external lat/lng changes
  useEffect(() => {
    if (markerRef.current && mapInstanceRef.current) {
      const curPos = markerRef.current.getLatLng();
      if (curPos.lat !== latitude || curPos.lng !== longitude) {
        markerRef.current.setLatLng([latitude, longitude]);
        mapInstanceRef.current.panTo([latitude, longitude]);
      }
    }
  }, [latitude, longitude]);

  const handleGetCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = parseFloat(position.coords.latitude.toFixed(6));
          const lon = parseFloat(position.coords.longitude.toFixed(6));
          onChange(lat, lon);
          if (mapInstanceRef.current) {
            mapInstanceRef.current.flyTo([lat, lon], 16);
          }
        },
        (error) => {
          alert('Could not detect location: ' + error.message);
        }
      );
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <MapPin className="w-4 h-4 text-rose-500" />
          Hazard Location (Click Map or Drag Pin)
        </label>
        <button
          type="button"
          onClick={handleGetCurrentLocation}
          className="flex items-center gap-1.5 text-xs font-medium text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 px-2.5 py-1 rounded-md border border-blue-500/20 transition-colors"
        >
          <Crosshair className="w-3.5 h-3.5" />
          Use GPS Location
        </button>
      </div>

      <div className="relative w-full h-64 rounded-xl overflow-hidden border border-slate-800 shadow-inner bg-slate-900">
        <div ref={mapContainerRef} className="w-full h-full" />
      </div>

      <div className="flex items-center gap-4 text-xs font-mono text-slate-400 bg-slate-900/60 px-3 py-2 rounded-lg border border-slate-800/80">
        <div>
          <span className="text-slate-500">LAT:</span> <span className="text-white font-medium">{latitude.toFixed(6)}</span>
        </div>
        <div>
          <span className="text-slate-500">LON:</span> <span className="text-white font-medium">{longitude.toFixed(6)}</span>
        </div>
      </div>
    </div>
  );
};

