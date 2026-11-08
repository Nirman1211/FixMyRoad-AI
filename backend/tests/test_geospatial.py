from app.services.geospatial_service import geospatial_service


def test_haversine_distance_known_points():
    # Empire State Building to Times Square: ~1,100 meters
    lat1, lon1 = 40.7484, -73.9857
    lat2, lon2 = 40.7580, -73.9855
    dist = geospatial_service.haversine_distance(lat1, lon1, lat2, lon2)
    assert 900.0 < dist < 1200.0


def test_haversine_distance_identical_point():
    lat, lon = 40.7128, -74.0060
    dist = geospatial_service.haversine_distance(lat, lon, lat, lon)
    assert dist < 0.001


def test_check_duplicate_true():
    existing = [(101, 40.712800, -74.006000)]
    # Target point 5 meters away
    target_lat, target_lon = 40.712830, -74.006020
    is_dup, ids = geospatial_service.check_duplicate(target_lat, target_lon, existing, threshold_meters=25.0)
    assert is_dup is True
    assert 101 in ids


def test_check_duplicate_false():
    existing = [(101, 40.712800, -74.006000)]
    # Target point ~500 meters away
    target_lat, target_lon = 40.716000, -74.006000
    is_dup, ids = geospatial_service.check_duplicate(target_lat, target_lon, existing, threshold_meters=25.0)
    assert is_dup is False
    assert len(ids) == 0
