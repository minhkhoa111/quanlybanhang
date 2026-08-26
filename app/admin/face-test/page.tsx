import { requireOwnerPage } from "@/app/admin-auth";
import FaceTestConsole from "./FaceTestConsole";

export const dynamic = "force-dynamic";

export default async function FaceTestPage() {
  await requireOwnerPage("/admin/face-test");

  return (
    <>
      <div className="admin-topline face-test-topline">
        <div>
          <span>AI &amp; sinh trắc học</span>
          <h1>Trung tâm kiểm thử khuôn mặt</h1>
          <p className="admin-subtitle">Đăng ký và xác minh mẫu khuôn mặt nhân viên bằng máy chủ DeepFace nội bộ.</p>
        </div>
        <div className="face-test-model"><i>AI</i><span><small>Mô hình nhận diện</small><strong>Facenet512 · DeepFace</strong></span></div>
      </div>
      <FaceTestConsole />
    </>
  );
}
