"""Infinity Company face verification service.

Run locally:
    pip install -r requirements.txt
    FACE_API_KEY='change-me' uvicorn face_server:app --host 0.0.0.0 --port 8001

The service never stores uploaded photos. It stores one DeepFace embedding per
employee in a local SQLite database.
"""

from __future__ import annotations

import base64
import hashlib
import hmac
import io
import json
import os
import sqlite3
import time
from pathlib import Path
from threading import Lock

import numpy as np
import cv2
from deepface import DeepFace
from fastapi import Depends, FastAPI, Header, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from PIL import Image, ImageOps, UnidentifiedImageError


APP_DIR = Path(__file__).resolve().parent
ROOT_ENV_PATH = APP_DIR.parent / ".env"


def load_local_environment() -> None:
    """Share local FACE_* settings with Next.js without extra dependencies."""
    if not ROOT_ENV_PATH.is_file():
        return
    for raw_line in ROOT_ENV_PATH.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        key = key.strip()
        if key not in {"FACE_API_KEY", "FACE_DATA_DIR", "FACE_MODEL_NAME", "FACE_DETECTOR_BACKEND", "FACE_DISTANCE_METRIC", "FACE_MATCH_THRESHOLD", "FACE_MAX_IMAGE_BYTES", "FACE_ENABLE_DOCS", "FACE_ALLOWED_ORIGINS"}:
            continue
        os.environ.setdefault(key, value.strip().strip('"').strip("'"))


load_local_environment()
DATA_DIR = Path(os.getenv("FACE_DATA_DIR", APP_DIR / "data")).resolve()
DATABASE_PATH = DATA_DIR / "faces.sqlite3"
MAX_IMAGE_BYTES = int(os.getenv("FACE_MAX_IMAGE_BYTES", str(8 * 1024 * 1024)))
MODEL_NAME = os.getenv("FACE_MODEL_NAME", "Facenet512")
DETECTOR_BACKEND = os.getenv("FACE_DETECTOR_BACKEND", "opencv")
DISTANCE_METRIC = os.getenv("FACE_DISTANCE_METRIC", "cosine")
MATCH_THRESHOLD = float(os.environ["FACE_MATCH_THRESHOLD"]) if os.getenv("FACE_MATCH_THRESHOLD") else None
API_KEY = os.getenv("FACE_API_KEY", "")
DATABASE_LOCK = Lock()
FACE_CASCADES = tuple(
    cascade
    for cascade in (
        cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml"),
        cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_alt2.xml"),
    )
    if not cascade.empty()
)

app = FastAPI(
    title="Infinity Company Face Verification",
    version="1.0.0",
    docs_url="/docs" if os.getenv("FACE_ENABLE_DOCS", "true").lower() == "true" else None,
    redoc_url=None,
)

allowed_origins = [item.strip() for item in os.getenv("FACE_ALLOWED_ORIGINS", "http://localhost:3000").split(",") if item.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST", "DELETE"],
    allow_headers=["Content-Type", "X-API-Key"],
)


def require_api_key(x_api_key: str = Header(default="")) -> None:
    if not API_KEY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="FACE_API_KEY chưa được cấu hình trên máy chủ.",
        )
    if not hmac.compare_digest(x_api_key.encode("utf-8"), API_KEY.encode("utf-8")):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="API key không hợp lệ.")


class FacePayload(BaseModel):
    employee_id: str = Field(min_length=1, max_length=100)
    image_base64: str = Field(min_length=100)


class VerifyResponse(BaseModel):
    verified: bool
    employee_id: str
    confidence: float
    distance: float
    message: str
    facial_area: dict[str, int]


@app.on_event("startup")
def initialize_database() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    with connect() as database:
        database.execute(
            """CREATE TABLE IF NOT EXISTS employee_faces (
                employee_id TEXT PRIMARY KEY,
                encoding_json TEXT NOT NULL,
                encoding_hash TEXT NOT NULL,
                model_name TEXT NOT NULL DEFAULT '',
                created_at INTEGER NOT NULL,
                updated_at INTEGER NOT NULL
            )"""
        )
        ensure_column(database, "employee_faces", "model_name", "TEXT NOT NULL DEFAULT ''")


@app.get("/health")
def health() -> dict[str, object]:
    with connect() as database:
        count = int(database.execute("SELECT COUNT(*) FROM employee_faces").fetchone()[0])
    return {"ok": True, "service": "infinity-company-face", "enrolled_employees": count}


@app.get("/employees", dependencies=[Depends(require_api_key)])
def list_employee_faces() -> dict[str, object]:
    with connect() as database:
        rows = database.execute(
            "SELECT employee_id,model_name,created_at,updated_at FROM employee_faces ORDER BY updated_at DESC"
        ).fetchall()
    return {
        "ok": True,
        "employees": [
            {
                "employee_id": str(row[0]),
                "model_name": str(row[1]),
                "created_at": int(row[2]),
                "updated_at": int(row[3]),
            }
            for row in rows
        ],
    }


@app.post("/enroll", dependencies=[Depends(require_api_key)])
def enroll(payload: FacePayload) -> dict[str, object]:
    employee_id = clean_employee_id(payload.employee_id)
    encoding, facial_area = extract_single_face(payload.image_base64)
    encoded_json = json.dumps(encoding.tolist(), separators=(",", ":"))
    encoding_hash = hashlib.sha256(encoded_json.encode("utf-8")).hexdigest()
    now = int(time.time())
    with DATABASE_LOCK, connect() as database:
        database.execute(
            """INSERT INTO employee_faces (employee_id,encoding_json,encoding_hash,model_name,created_at,updated_at)
               VALUES (?,?,?,?,?,?)
               ON CONFLICT(employee_id) DO UPDATE SET
                 encoding_json=excluded.encoding_json,
                 encoding_hash=excluded.encoding_hash,
                 model_name=excluded.model_name,
                 updated_at=excluded.updated_at""",
            (employee_id, encoded_json, encoding_hash, MODEL_NAME, now, now),
        )
    return {"ok": True, "employee_id": employee_id, "message": "Đã thêm khuôn mặt.", "facial_area": facial_area}


@app.post("/verify", response_model=VerifyResponse, dependencies=[Depends(require_api_key)])
def verify(payload: FacePayload) -> VerifyResponse:
    employee_id = clean_employee_id(payload.employee_id)
    with connect() as database:
        row = database.execute(
            "SELECT encoding_json,model_name FROM employee_faces WHERE employee_id=? LIMIT 1",
            (employee_id,),
        ).fetchone()
    if row is None:
        raise HTTPException(status_code=404, detail="Nhân viên chưa đăng ký khuôn mặt.")

    if row[1] != MODEL_NAME:
        raise HTTPException(status_code=409, detail="Dữ liệu khuôn mặt dùng model cũ. Vui lòng đăng ký lại.")

    stored_encoding = json.loads(row[0])
    if stored_encoding and isinstance(stored_encoding[0], list):
        known_encodings = [list(map(float, encoding)) for encoding in stored_encoding]
    else:
        known_encodings = [list(map(float, stored_encoding))]
    candidate_encoding, candidate_area = extract_single_face(payload.image_base64)
    results: list[dict[str, object]] = []
    for known_encoding in known_encodings:
        try:
            results.append(
                DeepFace.verify(
                    img1_path=known_encoding,
                    img2_path=candidate_encoding.tolist(),
                    model_name=MODEL_NAME,
                    detector_backend="skip",
                    distance_metric=DISTANCE_METRIC,
                    enforce_detection=False,
                    align=False,
                    threshold=MATCH_THRESHOLD,
                    silent=True,
                )
            )
        except (TypeError, ValueError) as error:
            raise HTTPException(status_code=422, detail="Không thể đối chiếu khuôn mặt bằng DeepFace.") from error
    result = min(results, key=lambda item: float(item.get("distance", 1.0)))
    distance = float(result.get("distance", 1.0))
    verified = bool(result.get("verified", False))
    deepface_confidence = float(result.get("confidence", max(0.0, 1.0 - distance) * 100))
    confidence = max(0.0, min(1.0, deepface_confidence / 100))
    return VerifyResponse(
        verified=verified,
        employee_id=employee_id,
        confidence=round(confidence, 4),
        distance=round(distance, 4),
        message="Khuôn mặt khớp." if verified else "Khuôn mặt không khớp.",
        facial_area=candidate_area,
    )


@app.post("/detect", dependencies=[Depends(require_api_key)])
def detect(payload: FacePayload) -> dict[str, object]:
    clean_employee_id(payload.employee_id)
    raw = decode_image(payload.image_base64)
    try:
        with Image.open(io.BytesIO(raw)) as source:
            image = ImageOps.exif_transpose(source).convert("RGB")
            if image.width * image.height > 16_000_000:
                image.thumbnail((4000, 4000))
            pixels = np.ascontiguousarray(np.asarray(image)[:, :, ::-1])
    except (UnidentifiedImageError, OSError, ValueError) as error:
        raise HTTPException(status_code=400, detail="Ảnh khuôn mặt không hợp lệ.") from error
    facial_area = detect_face_fast(pixels, image.width, image.height)
    if facial_area is None:
        raise HTTPException(status_code=422, detail="Chưa tìm thấy khuôn mặt trong camera.")
    return {"ok": True, "facial_area": facial_area}


@app.delete("/employees/{employee_id}", dependencies=[Depends(require_api_key)])
def delete_employee_face(employee_id: str) -> dict[str, object]:
    normalized_id = clean_employee_id(employee_id)
    with DATABASE_LOCK, connect() as database:
        result = database.execute("DELETE FROM employee_faces WHERE employee_id=?", (normalized_id,))
    if result.rowcount == 0:
        raise HTTPException(status_code=404, detail="Không tìm thấy dữ liệu khuôn mặt.")
    return {"ok": True, "employee_id": normalized_id, "message": "Đã xóa dữ liệu khuôn mặt."}


def extract_single_face(image_base64: str) -> tuple[np.ndarray, dict[str, int]]:
    raw = decode_image(image_base64)
    try:
        with Image.open(io.BytesIO(raw)) as source:
            image = ImageOps.exif_transpose(source).convert("RGB")
            if image.width * image.height > 16_000_000:
                image.thumbnail((4000, 4000))
            pixels = np.ascontiguousarray(np.asarray(image)[:, :, ::-1])
    except (UnidentifiedImageError, OSError, ValueError) as error:
        raise HTTPException(status_code=400, detail="Ảnh khuôn mặt không hợp lệ.") from error

    try:
        representations = DeepFace.represent(
            img_path=pixels,
            model_name=MODEL_NAME,
            detector_backend=DETECTOR_BACKEND,
            enforce_detection=True,
            align=True,
            max_faces=5,
        )
    except (TypeError, ValueError) as error:
        raise HTTPException(status_code=422, detail="Không tìm thấy khuôn mặt hợp lệ trong ảnh.") from error
    # OpenCV can mistake clothing, logos or shoulders for extra faces. A real,
    # front-facing enrollment must include both eye landmarks. Keep that face
    # and reject only when more than one credible face remains.
    credible_faces = [item for item in representations if is_credible_face(item, image.width, image.height)]
    if not credible_faces:
        raise HTTPException(status_code=422, detail="Không nhận diện rõ khuôn mặt. Hãy giữ đủ sáng; có thể đeo mắt kính trong suốt.")
    if len(credible_faces) > 1:
        raise HTTPException(status_code=422, detail="Khung hình có nhiều khuôn mặt. Vui lòng chỉ để một người trước camera.")
    embedding = credible_faces[0].get("embedding")
    if not isinstance(embedding, list) or not embedding:
        raise HTTPException(status_code=422, detail="Không thể trích xuất đặc trưng khuôn mặt.")
    area = credible_faces[0]["facial_area"]
    facial_area = {
        "x": max(0, int(area.get("x", 0))),
        "y": max(0, int(area.get("y", 0))),
        "w": max(1, int(area.get("w", image.width))),
        "h": max(1, int(area.get("h", image.height))),
        "image_width": int(image.width),
        "image_height": int(image.height),
    }
    return np.asarray(embedding, dtype=np.float64), facial_area


def is_credible_face(item: dict[str, object], image_width: int, image_height: int) -> bool:
    """Accept clear faces behind normal glasses without trusting tiny false detections."""
    area = item.get("facial_area")
    if not isinstance(area, dict):
        return False
    width = max(0, int(area.get("w", 0)))
    height = max(0, int(area.get("h", 0)))
    area_ratio = (width * height) / max(1, image_width * image_height)
    has_both_eyes = area.get("left_eye") is not None and area.get("right_eye") is not None
    confidence = float(item.get("face_confidence", 0.0) or 0.0)
    return area_ratio >= 0.025 and (has_both_eyes or confidence >= 0.45 or area_ratio >= 0.10)


def detect_face_fast(pixels: np.ndarray, image_width: int, image_height: int) -> dict[str, int] | None:
    """Fast, tolerant preview detection; DeepFace remains the final authority."""
    preview = pixels
    max_dimension = max(image_width, image_height)
    resize_scale = min(1.0, 640.0 / max_dimension)
    if resize_scale < 1.0:
        preview = cv2.resize(
            pixels,
            (max(1, round(image_width * resize_scale)), max(1, round(image_height * resize_scale))),
            interpolation=cv2.INTER_AREA,
        )
    gray = cv2.cvtColor(preview, cv2.COLOR_BGR2GRAY)
    normalized = cv2.equalizeHist(gray)
    minimum_face = max(36, round(min(normalized.shape[:2]) * 0.12))
    candidates: list[tuple[int, int, int, int]] = []
    for cascade in FACE_CASCADES:
        detected = cascade.detectMultiScale(
            normalized,
            scaleFactor=1.05,
            minNeighbors=3,
            minSize=(minimum_face, minimum_face),
            flags=cv2.CASCADE_SCALE_IMAGE,
        )
        candidates.extend(tuple(map(int, face)) for face in detected)
        if candidates:
            break
    if not candidates:
        return None
    x, y, width, height = max(candidates, key=lambda area: area[2] * area[3])
    inverse_scale = 1.0 / resize_scale
    return {
        "x": max(0, round(x * inverse_scale)),
        "y": max(0, round(y * inverse_scale)),
        "w": max(1, round(width * inverse_scale)),
        "h": max(1, round(height * inverse_scale)),
        "image_width": int(image_width),
        "image_height": int(image_height),
    }


def decode_image(value: str) -> bytes:
    encoded = value.split(",", 1)[1] if value.startswith("data:") and "," in value else value
    try:
        raw = base64.b64decode(encoded, validate=True)
    except (ValueError, base64.binascii.Error) as error:
        raise HTTPException(status_code=400, detail="Dữ liệu ảnh base64 không hợp lệ.") from error
    if not raw or len(raw) > MAX_IMAGE_BYTES:
        raise HTTPException(status_code=413, detail="Ảnh trống hoặc vượt quá dung lượng cho phép.")
    return raw


def clean_employee_id(value: str) -> str:
    normalized = value.strip()
    if not normalized or len(normalized) > 100 or any(ord(char) < 32 for char in normalized):
        raise HTTPException(status_code=400, detail="Mã nhân viên không hợp lệ.")
    return normalized


def connect() -> sqlite3.Connection:
    database = sqlite3.connect(DATABASE_PATH, timeout=10)
    database.execute("PRAGMA journal_mode=WAL")
    database.execute("PRAGMA foreign_keys=ON")
    return database


def ensure_column(database: sqlite3.Connection, table: str, column: str, definition: str) -> None:
    columns = {str(row[1]) for row in database.execute(f"PRAGMA table_info({table})")}
    if column not in columns:
        database.execute(f"ALTER TABLE {table} ADD COLUMN {column} {definition}")
