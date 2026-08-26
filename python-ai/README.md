# Huy Apple Face Server

Server Python độc lập dùng để đăng ký và đối chiếu khuôn mặt nhân viên. Ảnh gửi lên chỉ được xử lý trong bộ nhớ; hệ thống lưu vector khuôn mặt trong `data/faces.sqlite3`, không lưu ảnh gốc.

## Chạy trên macOS

```bash
cd python-ai
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
FACE_API_KEY='thay-bang-chuoi-bi-mat-dai' uvicorn face_server:app --host 0.0.0.0 --port 8001
```

Mở `http://localhost:8001/health` để kiểm tra. Tài liệu API ở `http://localhost:8001/docs`.

## API

- `POST /enroll`: đăng ký/cập nhật khuôn mặt theo `employee_id`.
- `POST /verify`: đối chiếu khuôn mặt với nhân viên đã đăng ký.
- `DELETE /employees/{employee_id}`: xóa dữ liệu khuôn mặt.
- `GET /health`: kiểm tra trạng thái server.

Các API thay đổi/đọc dữ liệu khuôn mặt yêu cầu header `X-API-Key` trùng với biến `FACE_API_KEY`. Payload ảnh:

```json
{
  "employee_id": "employee-id",
  "image_base64": "data:image/jpeg;base64,..."
}
```

Lưu ý: đối chiếu một ảnh không thay thế kiểm tra sống (liveness). Khi dùng chấm công thật, cần kết hợp đăng nhập nhân viên, HTTPS, giới hạn vị trí/thiết bị và kiểm tra liveness; không được tự động ghi nhận ngày công chỉ dựa trên kết quả từ camera.
