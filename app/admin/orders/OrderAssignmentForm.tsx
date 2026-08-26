"use client";

import { useMemo, useState } from "react";
import { assignOrderAction } from "../actions";

type BranchOption = { id: string; name: string };
type StaffOption = { id: string; name: string; branchId: string; role: string };

export default function OrderAssignmentForm({
  orderId,
  branches,
  staff,
  defaultBranchId,
  defaultAdminId,
  lockBranch,
}: {
  orderId: string;
  branches: BranchOption[];
  staff: StaffOption[];
  defaultBranchId: string;
  defaultAdminId: string;
  lockBranch: boolean;
}) {
  const initialBranch = defaultBranchId || branches[0]?.id || "";
  const [branchId, setBranchId] = useState(initialBranch);
  const availableStaff = useMemo(() => staff.filter((item) => item.branchId === branchId), [branchId, staff]);
  const selectedAdmin = availableStaff.some((item) => item.id === defaultAdminId) ? defaultAdminId : "";

  return (
    <form action={assignOrderAction} className="admin-order-assignment-form">
      <input type="hidden" name="id" value={orderId} />
      {lockBranch ? (
        <input type="hidden" name="branchId" value={branchId} />
      ) : (
        <label><span>Chi nhánh xử lý</span><select name="branchId" value={branchId} onChange={(event) => setBranchId(event.target.value)} required><option value="" disabled>Chọn chi nhánh</option>{branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}</select></label>
      )}
      {lockBranch && <p className="admin-assignment-locked"><span>Chi nhánh xử lý</span><strong>{branches.find((item) => item.id === branchId)?.name || "Chưa được phân chi nhánh"}</strong></p>}
      <label><span>Nhân viên phụ trách</span><select name="adminUserId" key={`${branchId}-${selectedAdmin}`} defaultValue={selectedAdmin}><option value="">Chưa giao nhân viên</option>{availableStaff.map((item) => <option key={item.id} value={item.id}>{item.name} · {roleLabel(item.role)}</option>)}</select></label>
      <button className="admin-button admin-button-primary" type="submit" disabled={!branchId}>Lưu phân công</button>
    </form>
  );
}

function roleLabel(role: string) {
  if (role === "manager") return "Quản lý";
  if (role === "consultant") return "Tư vấn";
  if (role === "warranty") return "Bảo hành";
  if (role === "repair") return "Sửa chữa";
  return "Bán hàng";
}
