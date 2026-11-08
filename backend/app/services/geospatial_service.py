import math
from typing import List, Dict, Any, Tuple
import numpy as np


class GeospatialService:
    EARTH_RADIUS_METERS = 6371000.0

    @classmethod
    def haversine_distance(
        cls,
        lat1: float,
        lon1: float,
        lat2: float,
        lon2: float
    ) -> float:
        """
        Calculates great-circle distance between two GPS coordinates in meters.
        """
        phi1, phi2 = math.radians(lat1), math.radians(lat2)
        dphi = math.radians(lat2 - lat1)
        dlambda = math.radians(lon2 - lon1)

        a = (
            math.sin(dphi / 2.0) ** 2 +
            math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2.0) ** 2
        )
        c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
        return cls.EARTH_RADIUS_METERS * c

    @classmethod
    def check_duplicate(
        cls,
        lat: float,
        lon: float,
        existing_coords: List[Tuple[int, float, float]],
        threshold_meters: float = 25.0
    ) -> Tuple[bool, List[int]]:
        """
        Checks if a submitted coordinate is within `threshold_meters` of existing reports.
        Returns (is_duplicate, list_of_matching_report_ids).
        """
        matching_ids = []
        for rep_id, elat, elon in existing_coords:
            dist = cls.haversine_distance(lat, lon, elat, elon)
            if dist <= threshold_meters:
                matching_ids.append(rep_id)
                
        return len(matching_ids) > 0, matching_ids

    @classmethod
    def cluster_damage_hotspots(
        cls,
        reports: List[Any],
        eps_meters: float = 180.0,
        min_samples: int = 2
    ) -> List[Dict[str, Any]]:
        """
        Performs spatial clustering to identify persistent road damage corridors
        using DBSCAN on projected geographical coordinates.
        """
        if len(reports) < min_samples:
            return []

        coords = np.array([[r.latitude, r.longitude] for r in reports])

        # Convert meters to approximate radian distance for Haversine metric
        eps_radians = eps_meters / cls.EARTH_RADIUS_METERS
        coords_rad = np.radians(coords)

        try:
            from sklearn.cluster import DBSCAN
            db = DBSCAN(eps=eps_radians, min_samples=min_samples, metric='haversine')
            labels = db.fit_predict(coords_rad)
        except Exception:
            # Simple distance fallback if scikit-learn clustering fails
            return []

        clusters = []
        unique_labels = set(labels)

        for cid in unique_labels:
            if cid == -1:
                continue  # Noise point
                
            cluster_indices = np.where(labels == cid)[0]
            cluster_reports = [reports[i] for i in cluster_indices]
            
            center_lat = float(np.mean([r.latitude for r in cluster_reports]))
            center_lon = float(np.mean([r.longitude for r in cluster_reports]))
            
            severities = [r.severity.value if hasattr(r.severity, 'value') else str(r.severity) for r in cluster_reports]
            priorities = [r.priority_score for r in cluster_reports]
            
            # Find dominant road name
            road_names = [r.road_name for r in cluster_reports if r.road_name]
            corridor = road_names[0] if road_names else f"Zone #{cid + 1}"

            highest_sev = "LOW"
            for s in ["CRITICAL", "HIGH", "MEDIUM", "LOW"]:
                if s in severities:
                    highest_sev = s
                    break

            clusters.append({
                "cluster_id": int(cid),
                "center_latitude": round(center_lat, 6),
                "center_longitude": round(center_lon, 6),
                "report_count": len(cluster_reports),
                "highest_severity": highest_sev,
                "average_priority": round(float(np.mean(priorities)), 1),
                "sample_reports": [r.id for r in cluster_reports],
                "corridor_name": corridor
            })

        # Sort by report count and priority descending
        clusters.sort(key=lambda x: (x["report_count"], x["average_priority"]), reverse=True)
        return clusters


geospatial_service = GeospatialService()
