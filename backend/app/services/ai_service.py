import os
import time
import uuid
import json
import logging
from typing import Dict, Any, List, Tuple
import cv2
import numpy as np

from app.core.config import settings

logger = logging.getLogger(__name__)


class AIService:
    def __init__(self):
        self.model = None
        self.rf_model = None
        self._init_models()

    def _init_models(self):
        # 1. Try initializing Ultralytics YOLO if enabled and model file exists
        if settings.USE_LOCAL_YOLO:
            try:
                model_path = os.path.join(settings.MODELS_DIR, "yolov8n.pt")
                if os.path.exists(model_path):
                    from ultralytics import YOLO
                    self.model = YOLO(model_path)
                    logger.info(f"Loaded local YOLO model from {model_path}")
                else:
                    logger.info("Local yolov8n.pt not found in models/; using OpenCV structural & texture analyzer.")
            except Exception as e:
                logger.warning(f"Could not load local YOLO model: {e}. Will use CV analyzer or Roboflow.")

        # 2. Try initializing Roboflow fallback if API key configured
        if settings.ROBOFLOW_API_KEY:
            try:
                from roboflow import Roboflow
                rf = Roboflow(api_key=settings.ROBOFLOW_API_KEY)
                project = rf.workspace().project(settings.ROBOFLOW_PROJECT)
                self.rf_model = project.version(settings.ROBOFLOW_VERSION).model
                logger.info("Configured Roboflow cloud API fallback")
            except Exception as e:
                logger.warning(f"Could not initialize Roboflow fallback: {e}")

    def analyze_road_damage(self, image_path: str) -> Dict[str, Any]:
        """
        Executes real computer vision road damage inference, generates annotated
        image, computes damage area ratio, and returns explainable severity metrics.
        """
        start_time = time.time()
        
        # Load image with OpenCV
        img = cv2.imread(image_path)
        if img is None:
            raise ValueError(f"Failed to decode image from path: {image_path}")

        height, width = img.shape[:2]
        image_area = height * width

        bounding_boxes = []
        inference_source = "cv_texture_analyzer"

        # 1. Try local YOLO model first
        if self.model is not None:
            try:
                results = self.model(image_path, conf=settings.CONFIDENCE_THRESHOLD, verbose=False)
                inference_source = "yolov8_local"
                for r in results:
                    boxes = r.boxes
                    for box in boxes:
                        coords = box.xyxy[0].tolist()
                        conf = float(box.conf[0])
                        cls_id = int(box.cls[0])
                        cls_name = r.names.get(cls_id, "pothole")
                        
                        bounding_boxes.append({
                            "x1": round(coords[0], 2),
                            "y1": round(coords[1], 2),
                            "x2": round(coords[2], 2),
                            "y2": round(coords[3], 2),
                            "confidence": round(conf, 3),
                            "class_name": cls_name
                        })
            except Exception as e:
                logger.error(f"YOLO inference failed: {e}")

        # 2. Fallback to Roboflow if local returned nothing and RF is configured
        if not bounding_boxes and self.rf_model is not None:
            try:
                rf_result = self.rf_model.predict(image_path).json()
                predictions = rf_result.get("predictions", [])
                inference_source = "roboflow_api"
                for p in predictions:
                    conf = p.get("confidence", 0.0)
                    if conf >= settings.CONFIDENCE_THRESHOLD:
                        cx, cy = p["x"], p["y"]
                        w, h = p["width"], p["height"]
                        bounding_boxes.append({
                            "x1": round(cx - w / 2, 2),
                            "y1": round(cy - h / 2, 2),
                            "x2": round(cx + w / 2, 2),
                            "y2": round(cy + h / 2, 2),
                            "confidence": round(conf, 3),
                            "class_name": p.get("class", "pothole")
                        })
            except Exception as e:
                logger.error(f"Roboflow prediction failed: {e}")

        # 3. If still no detections from external models, run high-precision OpenCV contour & darkness detection
        # This guarantees robust local operation even without GPU or external weights
        if not bounding_boxes:
            boxes = self._detect_pothole_contours(img)
            if boxes:
                bounding_boxes = boxes
                inference_source = "cv_structural_analyzer"

        # Compute damage metrics
        total_damage_area = 0.0
        conf_sum = 0.0
        for b in bounding_boxes:
            w = max(0.0, b["x2"] - b["x1"])
            h = max(0.0, b["y2"] - b["y1"])
            total_damage_area += (w * h)
            conf_sum += b["confidence"]

        pothole_count = len(bounding_boxes)
        damage_area_ratio = round(total_damage_area / image_area, 4) if image_area > 0 else 0.0
        avg_confidence = round(conf_sum / pothole_count, 3) if pothole_count > 0 else 0.0

        # Estimate severity and generate explanation
        visual_severity, explanation = self._estimate_severity(pothole_count, damage_area_ratio, avg_confidence)

        # Generate annotated image
        annotated_filename = f"{uuid.uuid4().hex}_annotated.jpg"
        annotated_path = os.path.join(settings.ANNOTATED_DIR, annotated_filename)
        self._generate_annotated_image(img, bounding_boxes, visual_severity, annotated_path)

        inference_time_ms = round((time.time() - start_time) * 1000, 2)

        return {
            "pothole_count": pothole_count,
            "damage_area_ratio": damage_area_ratio,
            "average_confidence": avg_confidence,
            "bounding_boxes": bounding_boxes,
            "visual_severity": visual_severity,
            "explanation": explanation,
            "annotated_image_url": f"/uploads/annotated/{annotated_filename}",
            "annotated_filename": annotated_filename,
            "inference_source": inference_source,
            "inference_time_ms": inference_time_ms,
            "model_version": "YOLOv8-CV-2.0"
        }

    def _detect_pothole_contours(self, img: np.ndarray) -> List[Dict[str, Any]]:
        """
        Computer Vision fallback: detects significant depressed road craters
        via adaptive grayscale thresholding, morphological closure, and contour saliency.
        """
        h, w = img.shape[:2]
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        blurred = cv2.GaussianBlur(gray, (7, 7), 0)
        
        # Look for dark irregular patches indicative of depth/cracks on asphalt
        thresh = cv2.adaptiveThreshold(
            blurred, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
            cv2.THRESH_BINARY_INV, 25, 4
        )
        
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (9, 9))
        closed = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, kernel, iterations=2)
        
        contours, _ = cv2.findContours(closed, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        boxes = []
        min_area = (h * w) * 0.005  # At least 0.5% of the frame
        max_area = (h * w) * 0.40   # Up to 40% of the frame
        
        for cnt in contours:
            area = cv2.contourArea(cnt)
            if min_area < area < max_area:
                x, y, bw, bh = cv2.boundingRect(cnt)
                # Compute aspect ratio check: potholes are generally round/oval, not needle-thin
                aspect = bw / float(bh)
                if 0.3 <= aspect <= 3.5:
                    confidence = round(min(0.88, 0.55 + (area / (h * w)) * 2), 2)
                    boxes.append({
                        "x1": float(x),
                        "y1": float(y),
                        "x2": float(x + bw),
                        "y2": float(y + bh),
                        "confidence": confidence,
                        "class_name": "pothole"
                    })
                    if len(boxes) >= 6:
                        break
        return boxes

    def _estimate_severity(self, count: int, area_ratio: float, avg_conf: float) -> Tuple[str, str]:
        """
        Computes transparent visual severity based on count, coverage ratio, and detection confidence.
        Note: Label is clearly marked as estimated visual severity rather than true physical depth.
        """
        if count == 0:
            return "LOW", "No prominent potholes detected. Minor surface roughness or superficial cracking observed."
        
        # Scoring index
        severity_index = (count * 20.0) + (area_ratio * 400.0)
        
        if count >= 3 or area_ratio >= 0.12 or severity_index >= 80:
            severity = "CRITICAL"
            reason = (
                f"Critical visual severity: Identified {count} distinct damage zone(s) covering "
                f"{area_ratio*100:.1f}% of the visible road surface with {avg_conf*100:.1f}% average confidence. "
                f"Extensive crater cluster poses immediate blowout or suspension hazard."
            )
        elif count >= 2 or area_ratio >= 0.05 or severity_index >= 50:
            severity = "HIGH"
            reason = (
                f"High visual severity: Detected {count} pothole(s) covering {area_ratio*100:.1f}% "
                f"of road frame ({avg_conf*100:.1f}% confidence). Significant cavity in traffic corridor requires prompt repair."
            )
        elif count == 1 and area_ratio >= 0.015:
            severity = "MEDIUM"
            reason = (
                f"Medium visual severity: Single defined road cavity covering {area_ratio*100:.1f}% "
                f"of lane surface ({avg_conf*100:.1f}% confidence). Moderate driving obstruction."
            )
        else:
            severity = "LOW"
            reason = (
                f"Low visual severity: Isolated surface defect ({count} detected, {area_ratio*100:.2f}% coverage). "
                f"Early-stage asphalt wear."
            )
            
        return severity, reason

    def _generate_annotated_image(
        self,
        img: np.ndarray,
        boxes: List[Dict[str, Any]],
        severity: str,
        output_path: str
    ):
        """
        Renders bounding boxes, label overlays, and a visual severity header.
        """
        annotated = img.copy()
        
        # Color mapping based on severity
        colors = {
            "CRITICAL": (0, 0, 220),   # Crimson Red (BGR)
            "HIGH": (0, 140, 255),      # Amber Orange
            "MEDIUM": (0, 215, 255),    # Golden Yellow
            "LOW": (0, 200, 50)         # Forest Green
        }
        color = colors.get(severity, (0, 140, 255))

        for idx, box in enumerate(boxes):
            x1, y1 = int(box["x1"]), int(box["y1"])
            x2, y2 = int(box["x2"]), int(box["y2"])
            conf = box["confidence"]
            label = f"Pothole #{idx+1} ({conf*100:.0f}%)"

            # Draw outer rectangle
            cv2.rectangle(annotated, (x1, y1), (x2, y2), color, 3)

            # Draw semi-transparent fill
            overlay = annotated.copy()
            cv2.rectangle(overlay, (x1, y1), (x2, y2), color, -1)
            cv2.addWeighted(overlay, 0.15, annotated, 0.85, 0, annotated)

            # Draw label banner
            (lbl_w, lbl_h), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.6, 2)
            cv2.rectangle(annotated, (x1, max(0, y1 - 25)), (x1 + lbl_w + 10, y1), color, -1)
            cv2.putText(
                annotated, label, (x1 + 5, y1 - 7),
                cv2.FONT_HERSHEY_SIMPLEX, 0.55, (255, 255, 255), 2, cv2.LINE_AA
            )

        # Header Watermark
        header_text = f"FixMyRoad AI - Severity: {severity} ({len(boxes)} detected)"
        cv2.rectangle(annotated, (0, 0), (annotated.shape[1], 36), (20, 24, 30), -1)
        cv2.putText(
            annotated, header_text, (12, 25),
            cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2, cv2.LINE_AA
        )

        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        cv2.imwrite(output_path, annotated)


ai_service = AIService()
