import { getManagedVouchers } from "@/db/vouchers";
import { deleteVoucherAction, saveVoucherAction, toggleVoucherAction } from "./actions";
import { formatMoney } from "../utils";

export const dynamic = "force-dynamic";
export default async function VoucherPage({ searchParams }: { searchParams: Promise<{ status?: string; error?: string }> }) {
  const query = await searchParams; const vouchers = await getManagedVouchers().catch(() => []);
  return <><div className="admin-topline"><div><span>Khuyến mãi</span><h1>Quản lý voucher</h1></div></div>
    {query.status && <p className="admin-alert success">Đã lưu voucher.</p>}{query.error && <p className="admin-alert error">{query.error}</p>}
    <section className="admin-card"><div className="admin-card-head"><div><span>Tạo mã mới</span><h2>Thiết lập ưu đãi</h2></div></div><form action={saveVoucherAction} className="admin-form-grid">
      <label className="admin-field">Mã voucher<input name="code" required placeholder="HUYAPPLE10" /></label>
      <label className="admin-field">Loại giảm<select name="type" defaultValue="percent"><option value="percent">Phần trăm (%)</option><option value="fixed">Số tiền cố định</option></select></label>
      <label className="admin-field">Giá trị<input name="value" required inputMode="numeric" placeholder="10" /></label>
      <label className="admin-field">Đơn tối thiểu<input name="minOrder" inputMode="numeric" placeholder="8000000" /></label>
      <label className="admin-field">Giảm tối đa<input name="maxDiscount" inputMode="numeric" placeholder="1000000; để 0 nếu không giới hạn" /></label>
      <label className="admin-field">Giới hạn lượt dùng<input name="usageLimit" inputMode="numeric" placeholder="100; để 0 nếu không giới hạn" /></label>
      <label className="admin-field">Bắt đầu<input name="startsAt" type="date" /></label><label className="admin-field">Kết thúc<input name="expiresAt" type="date" /></label>
      <label className="admin-check admin-span-2"><input name="active" type="checkbox" defaultChecked /> Kích hoạt ngay</label><button className="admin-button admin-button-primary admin-span-2">Tạo voucher</button>
    </form></section>
    <section className="admin-card"><div className="admin-card-head"><div><span>{vouchers.length} mã</span><h2>Voucher đang quản lý</h2></div></div><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Mã</th><th>Ưu đãi</th><th>Đơn tối thiểu</th><th>Đã dùng</th><th>Hiệu lực</th><th>Trạng thái</th><th>Thao tác</th></tr></thead><tbody>{vouchers.map((voucher) => <tr key={voucher.id}><td><strong>{voucher.code}</strong></td><td>{voucher.type === "percent" ? `${voucher.value}%` : formatMoney(voucher.value)}{voucher.maxDiscount > 0 && <span>Tối đa {formatMoney(voucher.maxDiscount)}</span>}</td><td>{formatMoney(voucher.minOrder)}</td><td>{voucher.usedCount}/{voucher.usageLimit || "∞"}</td><td><span>{voucher.startsAt ? new Date(voucher.startsAt).toLocaleDateString("vi-VN") : "Ngay"}</span>{voucher.expiresAt ? new Date(voucher.expiresAt).toLocaleDateString("vi-VN") : "Không hết hạn"}</td><td><span className={`admin-badge ${voucher.active ? "status-active" : "status-inactive"}`}>{voucher.active ? "Đang bật" : "Đã tắt"}</span></td><td><div className="admin-row-actions"><form action={toggleVoucherAction}><input type="hidden" name="id" value={voucher.id} /><input type="hidden" name="active" value={String(!voucher.active)} /><button>{voucher.active ? "Tắt" : "Bật"}</button></form><form action={deleteVoucherAction}><input type="hidden" name="id" value={voucher.id} /><button>Xóa</button></form></div></td></tr>)}</tbody></table>{!vouchers.length && <div className="admin-empty-state">Chưa có voucher nào.</div>}</div></section></>;
}
