import os
import io
from PIL import Image
from fastapi import status


def test_ai_detection_standalone_endpoint(client):
    # Create a small RGB test image
    img = Image.new("RGB", (320, 240), color=(80, 80, 80))
    img_byte_arr = io.BytesIO()
    img.save(img_byte_arr, format="JPEG")
    img_byte_arr.seek(0)

    files = {"image": ("test_road.jpg", img_byte_arr, "image/jpeg")}
    response = client.post("/api/v1/ai/detect", files=files)
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert "pothole_count" in data
    assert "visual_severity" in data
    assert "explanation" in data
    assert "inference_time_ms" in data


def test_report_submission_with_image_and_ai_inference(client, citizen_headers):
    # Use one of the real copied sample road damage images if available
    sample_img_dir = "uploads/original"
    sample_file = None
    if os.path.exists(sample_img_dir):
        files = [f for f in os.listdir(sample_img_dir) if f.endswith((".jpg", ".png", ".webp"))]
        if files:
            sample_file = os.path.join(sample_img_dir, files[0])

    if sample_file and os.path.exists(sample_file):
        with open(sample_file, "rb") as f:
            file_content = f.read()
    else:
        img = Image.new("RGB", (400, 300), color=(60, 60, 60))
        img_byte_arr = io.BytesIO()
        img.save(img_byte_arr, format="JPEG")
        file_content = img_byte_arr.getvalue()

    form_data = {
        "title": "Severe Pothole on Broadway",
        "description": "Deep depression in the road surface affecting traffic flow.",
        "road_name": "Broadway Avenue",
        "landmark": "Near Central Library",
        "latitude": 40.7128,
        "longitude": -74.0060,
        "road_type": "PRIMARY"
    }

    files = {"image": ("pothole_evidence.jpg", io.BytesIO(file_content), "image/jpeg")}

    response = client.post("/api/v1/reports", data=form_data, files=files, headers=citizen_headers)
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert data["report_code"].startswith("FMR-")
    assert data["priority_score"] > 0
    assert "ai_prediction" in data
    assert "priority_breakdown" in data
    assert len(data["images"]) > 0
