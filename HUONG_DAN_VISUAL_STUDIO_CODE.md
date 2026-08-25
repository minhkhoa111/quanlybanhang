# Hướng dẫn mở source Huy Apple bằng Visual Studio Code

## 1. Chuẩn bị

- Cài Visual Studio Code.
- Cài Node.js phiên bản 22.13 trở lên.
- Giải nén file source vào một thư mục dễ tìm.

## 2. Chạy website trên máy

1. Mở Visual Studio Code, chọn **File > Open Folder** và mở thư mục `huy-apple`.
2. Mở **Terminal > New Terminal**.
3. Chạy lần lượt:

```bash
npm install
npm run dev
```

4. Mở địa chỉ được hiện trong Terminal (thường là `http://localhost:3000`).

## 3. Những file thường cần sửa

- `app/products.ts`: tên, giá, thông số và hình ảnh sản phẩm.
- `app/layout.tsx`: menu và thông tin chung của cửa hàng.
- `app/page.tsx`: nội dung trang chủ.
- `app/tu-van/ConsultationForm.tsx`: biểu mẫu đặt hàng và email nhận thông tin.
- `app/globals.css`: màu sắc, kiểu chữ và giao diện.
- `public/products`: hình ảnh sản phẩm.

## 4. Email nhận đơn đặt hàng

- Email nhận chính: `aydomkhoa123@gmail.com`.
- Email đồng nhận: `nguyenmkhoa2010@icloud.com`.
- Dịch vụ gửi biểu mẫu: FormSubmit.

Ở lần gửi thử đầu tiên, FormSubmit sẽ gửi thư xác nhận đến Gmail chính. Hãy mở
thư đó và bấm nút xác nhận; các đơn sau mới được chuyển đầy đủ tới Gmail và
đồng gửi sang iCloud. Nếu chưa thấy thư, hãy kiểm tra mục Spam/Thư rác.

## 5. Kiểm tra bản hoàn chỉnh

```bash
npm run build
```

Nếu lệnh kết thúc mà không báo lỗi, source đã sẵn sàng để triển khai.

## 6. Quản lý sản phẩm trực tiếp trên website

Sau khi website được xuất bản, mở đường dẫn `/quan-ly` ở cuối địa chỉ website.
Đăng nhập bằng ChatGPT với một trong hai email đã được cấp quyền:

- `aydomkhoa123@gmail.com`
- `nguyenmkhoa2010@icloud.com`

Tại đây có thể thêm sản phẩm, tải ảnh, sửa giá và thông số, đánh dấu sản phẩm
nổi bật hoặc ẩn sản phẩm khỏi cửa hàng. Các thay đổi được lưu trong cơ sở dữ
liệu và không cần mở Visual Studio Code.
