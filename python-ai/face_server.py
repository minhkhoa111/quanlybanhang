"""Huy Apple face verification service.

Run locally:
    pip install -r requirements.txt
    FACE_API_KEY='change-me' uvicorn face_server:app --host 0.0.0.0 --port 8001

The service never stores uploaded photos. It stores one 128-dimensional face
encoding per employee in a local SQLite database.
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

import face_recognition
import numpy as np
from fastapi import Depends, FastAPI, Header, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from PIL import Image, ImageOps, UnidentifiedImageError


APP_DIR = Path(__file__).resolve().parent
DATA_DIR = Path(os.getenv("FACE_DATA_DIR", APP_DIR / "data")).resolve()
DATABASE_PATH = DATA_DIR / "faces.sqlite3"
MAX_IMAGE_BYTES = int(os.getenv("FACE_MAX_IMAGE_BYTES", str(8 * 1024 * 1024)))
MATCH_THRESHOLD = float(os.getenv("FACE_MATCH_THRESHOLD", "0.5"))
API_KEY = os.getenv("FACE_API_KEY", "")
DATABASE_LOCK = Lock()

app = FastAPI(
    title="Huy Apple Face Verification",
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


class FacePayload(BaseModel):
    employee_id: str = Field(min_length=1, max_length=100)
    image_base64: str = Field(min_length=100)


class VerifyResponse(BaseModel):
    verified: bool
    employee_id: str
    confidence: float
    distance: float
    message: str


@app.on_event("startup")
def initialize_database() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    with connect() as database:
        database.execute(
            """CREATE TABLE IF NOT EXISTS employee_faces (
                employee_id TEXT PRIMARY KEY,
                encoding_json TEXT NOT NULL,
                encoding_hash TEXT NOT NULL,
                created_at INTEGER NOT NULL,
                updated_at INTEGER NOT NULL
            )"""
        )


@app.get("/health")
def health() -> dict[str, object]:
    with connect() as database:
        count = int(database.execute("SELECT COUNT(*) FROM employee_faces").fetchone()[0])
    return {"ok": True, "service": "huy-apple-face", "enrolled_employees": count}


@app.post("/enroll", dependencies=[Depends(require_api_key)])
def enroll(payload: FacePayload) -> dict[str, object]:
    employee_id = clean_employee_id(payload.employee_id)
    encoding = extract_single_face(payload.image_base64)
    encoded_json = json.dumps(encoding.tolist(), separators=(",", ":"))
    encoding_hash = hashlib.sha256(encoded_json.encode("utf-8")).hexdigest()
    now = int(time.time())
    with DATABASE_LOCK, connect() as database:
        database.execute(
            """INSERT INTO employee_faces (employee_id,encoding_json,encoding_hash,created_at,updated_at)
               VALUES (?,?,?,?,?)
               ON CONFLICT(employee_id) DO UPDATE SET
                 encoding_json=excluded.encoding_json,
                 encoding_hash=excluded.encoding_hash,
                 updated_at=excluded.updated_at""",
            (employee_id, encoded_json, encoding_hash, now, now),
        )
    return {"ok": True, "employee_id": employee_id, "message": "Đã đăng ký khuôn mặt nhân viên."}


@app.post("/verify", response_model=VerifyResponse, dependencies=[Depends(require_api_key)])
def verify(payload: FacePayload) -> VerifyResponse:
    employee_id = clean_employee_id(payload.employee_id)
    with connect() as database:
        row = database.execute(
            "SELECT encoding_json FROM employee_faces WHERE employee_id=? LIMIT 1",
            (employee_id,),
        ).fetchone()
    if row is None:
        raise HTTPException(status_code=404, detail="Nhân viên chưa đăng ký khuôn mặt.")

    known_encoding = np.asarray(json.loads(row[0]), dtype=np.float64)
    candidate_encoding = extract_single_face(payload.image_base64)
    distance = float(face_recognition.face_distance([known_encoding], candidate_encoding)[0])
    verified = distance <= MATCH_THRESHOLD
    confidence = max(0.0, min(1.0, 1.0 - distance))
    return VerifyResponse(
        verified=verified,
        employee_id=employee_id,
        confidence=round(confidence, 4),
        distance=round(distance, 4),
        message="Khuôn mặt khớp." if verified else "Khuôn mặt không khớp.",
    )


@app.delete("/employees/{employee_id}", dependencies=[Depends(require_api_key)])
def delete_employee_face(employee_id: str) -> dict[str, object]:
    normalized_id = clean_employee_id(employee_id)
    with DATABASE_LOCK, connect() as database:
        result = database.execute("DELETE FROM employee_faces WHERE employee_id=?", (normalized_id,))
    if result.rowcount == 0:
        raise HTTPException(status_code=404, detail="Không tìm thấy dữ liệu khuôn mặt.")
    return {"ok": True, "employee_id": normalized_id, "message": "Đã xóa dữ liệu khuôn mặt."}


def require_api_key(x_api_key: str = Header(default="")) -> None:
    if not API_KEY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="FACE_API_KEY chưa được cấu hình trên máy chủ.",
        )
    if not hmac.compare_digest(x_api_key.encode("utf-8"), API_KEY.encode("utf-8")):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="API key không hợp lệ.")


def extract_single_face(image_base64: str) -> np.ndarray:
    raw = decode_image(image_base64)
    try:
        with Image.open(io.BytesIO(raw)) as source:
            image = ImageOps.exif_transpose(source).convert("RGB")
            if image.width * image.height > 16_000_000:
                image.thumbnail((4000, 4000))
            pixels = np.asarray(image)
    except (UnidentifiedImageError, OSError, ValueError) as error:
        raise HTTPException(status_code=400, detail="Ảnh khuôn mặt không hợp lệ.") from error

    locations = face_recognition.face_locations(pixels, model="hog")
    if not locations:
        raise HTTPException(status_code=422, detail="Không tìm thấy khuôn mặt trong ảnh.")
    if len(locations) != 1:
        raise HTTPException(status_code=422, detail="Ảnh phải có đúng một khuôn mặt.")
    encodings = face_recognition.face_encodings(pixels, known_face_locations=locations, num_jitters=1)
    if not encodings:
        raise HTTPException(status_code=422, detail="Không thể trích xuất đặc trưng khuôn mặt.")
    return encodings[0]


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

