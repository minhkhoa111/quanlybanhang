import { requireAdminPage } from "@/app/admin-auth";
import { getAdminUsers } from "@/db/admin-users";
import { getBranches } from "@/db/branches";
import { getAccessibleCameras, getCameraPermissions } from "@/db/cameras";
import CameraViewer from "./CameraViewer";
import { createCameraAction, grantCameraAction, revokeCameraAction, toggleCameraAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function CamerasPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; status?: string }>;
}) {
  const user = await requireAdminPage("/admin/cameras");
  const isOwner = user.role === "owner";
  const [cameras, branches, users, permissions, query] = await Promise.all([
    getAccessibleCameras(user).catch(() => []),
    isOwner ? getBranches(false).catch(() => []) : Promise.resolve([]),
    isOwner ? getAdminUsers().catch(() => []) : Promise.resolve([]),
    isOwner ? getCameraPermissions().catch(() => []) : Promise.resolve([]),
    searchParams,
  ]);
  const staff = users.filter((item) => item.role !== "owner" && item.active);

  return (
    <>
      <div className="admin-topline camera-page-toolbar">
        <div>
          <span>An ninh cửa hàng</span>
          <h1>Camera chi nhánh</h1>
          <p className="admin-subtitle">
            {isOwner
              ? "Theo dõi toàn hệ thống và kiểm soát chính xác nhân viên được xem camera của từng chi nhánh."
              : "Bạn chỉ nhìn thấy camera đang hoạt động tại những chi nhánh được chủ hệ thống cấp quyền."}
          </p>
        </div>
        <div className="camera-security-pill"><i /> Quyền truy cập được bảo vệ</div>
      </div>

      {query.status === "camera-created" && <p className="admin-alert success">Đã thêm camera vào chi nhánh.</p>}
      {query.status === "permission-created" && <p className="admin-alert success">Đã cấp quyền xem camera cho nhân viên.</p>}
      {query.error && <p className="admin-alert error">{query.error}</p>}

      <section className="admin-branch-summary camera-summary">
        <article><span>Camera có thể truy cập</span><strong>{cameras.length}</strong></article>
        <article><span>Đang hoạt động</span><strong>{cameras.filter((camera) => camera.active).length}</strong></article>
        <article><span>Phạm vi tài khoản</span><strong className="camera-scope-label">{isOwner ? "Toàn hệ thống" : "Được cấp quyền"}</strong></article>
      </section>

      <section className="camera-grid">
        {cameras.map((camera) => (
          <article className={`camera-card ${camera.active ? "" : "is-inactive"}`} key={camera.id}>
            <header>
              <div><span>{camera.branchName}</span><h2>{camera.name}</h2></div>
              <b className={camera.active ? "is-online" : ""}>{camera.active ? "Trực tuyến" : "Tạm ngưng"}</b>
            </header>
            <CameraViewer camera={camera} />
            <footer>
              <div><span>Vị trí</span><strong>{camera.location || "Chưa ghi chú"}</strong></div>
              <div><span>Loại luồng</span><strong>{streamTypeLabel(camera.streamType)}</strong></div>
              {isOwner && (
                <form action={toggleCameraAction}>
                  <input type="hidden" name="id" value={camera.id} />
                  <input type="hidden" name="active" value={String(!camera.active)} />
                  <button className="admin-button" type="submit">{camera.active ? "Tạm ngưng" : "Kích hoạt"}</button>
                </form>
              )}
            </footer>
          </article>
        ))}
        {!cameras.length && (
          <div className="admin-card camera-empty-state">
            <span className="camera-lens" aria-hidden="true" />
            <h2>{isOwner ? "Chưa có camera nào" : "Tài khoản chưa được cấp quyền camera"}</h2>
            <p>{isOwner ? "Thêm camera đầu tiên bằng biểu mẫu quản lý phía dưới." : "Vui lòng liên hệ chủ hệ thống để được cấp quyền xem camera của chi nhánh phù hợp."}</p>
          </div>
        )}
      </section>

      {isOwner && (
        <section className="camera-management-grid">
          <article className="admin-card">
            <div className="admin-card-head"><div><span>Thiết bị mới</span><h2>Thêm camera chi nhánh</h2></div></div>
            {!branches.length && <p className="admin-alert error">Cần tạo ít nhất một chi nhánh đang hoạt động trước khi thêm camera.</p>}
            <form action={createCameraAction} className="camera-management-form">
              <label className="admin-field"><span>Chi nhánh</span><select name="branchId" required defaultValue=""><option value="" disabled>Chọn chi nhánh</option>{branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}</select></label>
              <label className="admin-field"><span>Tên camera</span><input name="name" required placeholder="Camera quầy thu ngân" /></label>
              <label className="admin-field"><span>Vị trí lắp đặt</span><input name="location" placeholder="Tầng 1 · Quầy thanh toán" /></label>
              <label className="admin-field"><span>Định dạng luồng</span><select name="streamType" defaultValue="embed"><option value="embed">Trang nhúng / NVR</option><option value="video">Video HLS hoặc MP4</option><option value="snapshot">Ảnh snapshot tự làm mới</option></select></label>
              <label className="admin-field camera-form-wide"><span>URL xem camera</span><input name="streamUrl" type="url" required placeholder="https://camera.example.com/embed/..." /></label>
              <p className="camera-form-note">Nên dùng HTTPS. Luồng RTSP cần chuyển qua HLS hoặc trang xem của đầu ghi NVR để trình duyệt phát được.</p>
              <button className="admin-button admin-button-primary" type="submit" disabled={!branches.length}>Thêm camera</button>
            </form>
          </article>

          <article className="admin-card">
            <div className="admin-card-head"><div><span>Phân quyền theo chi nhánh</span><h2>Cấp quyền xem camera</h2></div></div>
            <form action={grantCameraAction} className="camera-permission-form">
              <label className="admin-field"><span>Nhân viên</span><select name="adminUserId" required defaultValue=""><option value="" disabled>Chọn nhân viên</option>{staff.map((item) => <option key={item.id} value={item.id}>{item.name} · {roleLabel(item.role)}</option>)}</select></label>
              <label className="admin-field"><span>Chi nhánh được xem</span><select name="branchId" required defaultValue=""><option value="" disabled>Chọn chi nhánh</option>{branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}</select></label>
              <button className="admin-button admin-button-primary" type="submit" disabled={!staff.length || !branches.length}>Cấp quyền</button>
            </form>
            <div className="camera-permission-list">
              {permissions.map((permission) => (
                <div key={permission.id}>
                  <span className="camera-user-avatar">{permission.userName.slice(0, 1).toUpperCase()}</span>
                  <p><strong>{permission.userName}</strong><span>Được xem · {permission.branchName}</span></p>
                  <form action={revokeCameraAction}><input type="hidden" name="id" value={permission.id} /><button className="admin-button admin-button-danger" type="submit">Thu hồi</button></form>
                </div>
              ))}
              {!permissions.length && <p className="camera-no-permission">Chưa cấp quyền camera cho nhân viên nào.</p>}
            </div>
          </article>
        </section>
      )}
    </>
  );
}

function streamTypeLabel(type: string) {
  if (type === "video") return "Video trực tiếp";
  if (type === "snapshot") return "Ảnh snapshot";
  return "Trang nhúng";
}

function roleLabel(role: string) {
  if (role === "manager") return "Quản lý";
  if (role === "consultant") return "Tư vấn";
  if (role === "warranty") return "Bảo hành";
  if (role === "repair") return "Sửa chữa";
  return "Bán hàng";
}
