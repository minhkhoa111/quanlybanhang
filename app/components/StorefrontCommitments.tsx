"use client";

export default function StorefrontCommitments() {
  return (
    <section className="cps-container cps-commitments" aria-label="Cam kết bán hàng">
      <div className="cps-commitments-grid">
        <div className="cps-commit-item">
          <div className="cps-commit-icon" aria-hidden="true">✓</div>
          <div className="cps-commit-text">
            <h4>100% Hàng chính hãng</h4>
            <p>Xuất hóa đơn VAT đầy đủ theo yêu cầu</p>
          </div>
        </div>

        <div className="cps-commit-item">
          <div className="cps-commit-icon" aria-hidden="true">⚡</div>
          <div className="cps-commit-text">
            <h4>Giao nhanh hỏa tốc 2h</h4>
            <p>Miễn phí giao hàng đơn từ 300.000₫</p>
          </div>
        </div>

        <div className="cps-commit-item">
          <div className="cps-commit-icon" aria-hidden="true">↺</div>
          <div className="cps-commit-text">
            <h4>Thu cũ đổi mới trợ giá</h4>
            <p>Định giá cao, trợ giá lên đời đến 95%</p>
          </div>
        </div>

        <div className="cps-commit-item">
          <div className="cps-commit-icon" aria-hidden="true">🛡️</div>
          <div className="cps-commit-text">
            <h4>Bảo hành chính hãng 12T</h4>
            <p>1 đổi 1 trong 30 ngày nếu có lỗi</p>
          </div>
        </div>
      </div>
    </section>
  );
}
