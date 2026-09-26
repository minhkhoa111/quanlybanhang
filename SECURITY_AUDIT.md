# Báo cáo rà soát bảo mật Infinity Store

Ngày rà soát: 11/09/2026

## Phạm vi

- Cloudflare Worker, toàn bộ route trong `app/api`, Server Actions quản trị và lớp dữ liệu D1/R2.
- Dịch vụ nhận diện khuôn mặt FastAPI/DeepFace.
- Dependency npm và Python được cài từ các tệp khóa/yêu cầu hiện tại.
- Mã nguồn hiện tại được quét tìm mẫu API key, token, JWT, private key và mật khẩu dự phòng có độ tin cậy cao.

## Đã khắc phục

### 1. Giới hạn tần suất request

- Mọi route `/api/*` được giới hạn tại Worker trước khi vào ứng dụng.
- Login, đăng ký, Google OAuth, quên/đặt lại mật khẩu và xác minh OTP: tối đa 5 request cho mỗi IP và mỗi route trong 15 phút.
- API thông thường: 180 request đọc/phút hoặc 60 request ghi/phút.
- API khuôn mặt: 20 request/phút tại Worker; máy DeepFace trực tiếp cũng có giới hạn riêng.
- Bộ đếm dùng D1 để hoạt động đồng nhất giữa các Worker instance, có bộ đếm trong bộ nhớ làm phương án dự phòng khi D1 tạm lỗi.
- Response `429` có `Retry-After` và các header RateLimit.

### 2. Bí mật và cấu hình nhạy cảm

- Đã xóa mật khẩu quản trị mặc định và khóa mã hóa hồ sơ nhân sự mặc định khỏi source.
- Đã xóa token reseed mặc định và không còn truyền token qua query string.
- Route reseed chỉ hoạt động ngoài production và yêu cầu phiên đăng nhập Giám đốc.
- `ADMIN_PASSWORD`, `HR_DATA_KEY`, OAuth, webhook, Twilio và Face API được khai báo trong `.env.example`; giá trị thật chỉ nằm trong môi trường server.
- `.env`, `.env.*`, private key, build và state Cloudflare đã nằm trong `.gitignore`; `.env` hiện không có trong Git index.
- Không tìm thấy secret literal có độ tin cậy cao trong mã nguồn hiện tại. Lịch sử Git chưa thể quét tự động vì Git trên máy đang bị khóa bởi yêu cầu chấp nhận Xcode license.

### 3. Kiểm tra và làm sạch input

- Từ chối `Content-Length` sai, payload quá lớn, JSON hỏng, JSON root không phải object, object lồng quá sâu, mảng/quá nhiều trường, chuỗi quá dài và các key prototype-pollution.
- Từ chối mutation cross-site bằng `Origin`/`Sec-Fetch-Site`, trừ webhook Casso đã xác thực bằng secret riêng.
- Giới hạn riêng cho avatar, ảnh khuôn mặt và các payload ảnh.
- Avatar được kiểm tra chữ ký nhị phân JPEG/PNG/WebP thay vì chỉ tin MIME do trình duyệt gửi.
- DeepFace kiểm tra kích thước request, base64 hợp lệ, kích thước ảnh, số khuôn mặt và ID nhân viên.

### 4. Dependency

- npm: giảm từ 24 lỗ hổng (1 critical, 16 high, 6 moderate, 1 low) xuống 6 (2 high, 4 moderate), không còn critical.
- Đã nâng Next.js, React Server Components, Vite, Wrangler và Cloudflare Vite plugin lên bản vá tương thích.
- Python ban đầu có 43 advisory trong Pillow/Starlette; sau khi nâng FastAPI, Starlette và Pillow, `pip-audit` báo không còn lỗ hổng đã biết.

## Rủi ro còn lại

| Mức | Vấn đề | Ảnh hưởng và hướng xử lý |
|---|---|---|
| Cao | `vinext@0.0.50` kéo `image-size` có advisory DoS | npm chỉ cung cấp cách sửa bằng `vinext@1.0.0-beta.9`, là nâng cấp lớn/beta. Payload ảnh đi qua các giới hạn và ảnh storefront không tối ưu tại Next nên khả năng khai thác đã giảm, nhưng cần lên lịch nâng Vinext riêng và regression test toàn bộ site. |
| Trung bình | `drizzle-kit` kéo `@esbuild-kit/*`/esbuild cũ | Chỉ là công cụ phát triển tạo migration, không được đóng vào runtime production. Không mở dev server ra Internet. npm đề xuất hạ về Drizzle Kit 0.18.1 bằng `--force`, có thể phá schema workflow nên chưa áp dụng. |
| Trung bình | Dữ liệu embedding khuôn mặt trong SQLite chưa mã hóa ở cấp file | Chỉ bind máy DeepFace vào loopback/private tunnel, giới hạn quyền đọc thư mục `python-ai/data`, mã hóa ổ đĩa/backup; cân nhắc mã hóa embedding bằng key riêng nếu triển khai nhiều máy. |
| Trung bình | PBKDF2 hiện dùng 120.000 vòng và chưa có version hash | Cần migration hash có version để tăng work factor mà không làm người dùng hiện tại mất đăng nhập; rehash dần sau lần đăng nhập thành công. |
| Trung bình | File công việc Office/PDF/ZIP mới kiểm tra size và MIME | Nên thêm quét malware trước khi cho tải xuống nếu hệ thống nhận file từ nguồn không tin cậy. |
| Thấp | Chưa bật CSP nghiêm ngặt cho toàn giao diện | Hiện đã có `nosniff`, chống iframe, HSTS, referrer và permissions policy. CSP cần triển khai theo nonce/hash vì giao diện hiện có style/script do framework sinh ra. |

## Việc bắt buộc trước khi đưa production

1. Đặt secret mạnh, khác nhau cho `ADMIN_PASSWORD` và `HR_DATA_KEY`; không dùng chuỗi mẫu trong `.env.example`.
2. Đặt `CASSO_WEBHOOK_SECRET`, Google/Twilio và `FACE_API_KEY` bằng Cloudflare/Sites secret, không đặt biến `VITE_*` cho các giá trị này.
3. Chạy migration `0017_api_security.sql` khi triển khai D1. Worker cũng tự tạo bảng như phương án tương thích, nhưng migration vẫn là nguồn schema chính.
4. Giữ DeepFace sau Next.js/private tunnel; không công khai cổng 8001 trực tiếp.
5. Sau khi chấp nhận Xcode license, quét lại toàn bộ lịch sử Git. Nếu từng commit secret thật, phải rotate/revoke secret; chỉ xóa commit không làm secret cũ an toàn trở lại.

## Xác minh đã chạy

- `npx tsc --noEmit`: đạt.
- `npm run build`: đạt với Vite 8.3.0.
- Kiểm thử runtime: JSON hỏng → 400; request cross-origin → 403; lần OTP thứ 6 → 429.
- `pip-audit -r python-ai/requirements.txt`: không còn lỗ hổng đã biết.
- Test repository: 38/44 đạt; 6 test snapshot/expectation cũ đang lỗi do nội dung và bố cục storefront hiện tại, không phát sinh từ lớp bảo mật.
- ESLint còn 8 lỗi và 1 cảnh báo ở các component storefront cũ; cần sửa ở đợt UI riêng.
