export default function PayrollLoading() {
  return (
    <>
      <div className="admin-topline">
        <div>
          <span>Tài chính nhân sự</span>
          <h1>Đang tải bảng lương…</h1>
          <p className="admin-subtitle">Hệ thống đang tổng hợp nhân sự, ngày công và số liệu theo chi nhánh.</p>
        </div>
      </div>
      <section className="admin-card admin-empty-state" role="status" aria-live="polite">
        Vui lòng chờ trong giây lát.
      </section>
    </>
  );
}
