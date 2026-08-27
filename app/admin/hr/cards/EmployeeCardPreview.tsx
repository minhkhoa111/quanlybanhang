"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import InfinityBrandMark from "@/app/components/InfinityBrandMark";

type CardEmployee = {
  adminUserId: string;
  name: string;
  role: string;
  branch: string;
  photoKey: string;
  joinedDate: string;
};

const digitPatterns: Record<string, string> = {
  "0": "nnnwwnwnn", "1": "wnnwnnnnw", "2": "nnwwnnnnw", "3": "wnwwnnnnn", "4": "nnnwwnnnw",
  "5": "wnnwwnnnn", "6": "nnwwwnnnn", "7": "nnnwnnwnw", "8": "wnnwnnwnn", "9": "nnwwnnwnn", "*": "nwnnwnwnn",
};

export default function EmployeeCardPreview({ employee }: { employee: CardEmployee }) {
  const code = useMemo(() => employeeCode(employee.adminUserId), [employee.adminUserId]);
  const [qr, setQr] = useState("");

  useEffect(() => {
    const payload = JSON.stringify({ type: "INFINITY_COMPANY_EMPLOYEE", code, name: employee.name, role: roleLabel(employee.role), branch: employee.branch });
    QRCode.toDataURL(payload, { errorCorrectionLevel: "H", margin: 1, width: 320, color: { dark: "#0b315a", light: "#ffffff" } })
      .then(setQr)
      .catch(() => setQr(""));
  }, [code, employee.branch, employee.name, employee.role]);

  return <>
    <div className="employee-card-toolbar">
      <div><span>Mã nhân viên</span><strong>{code}</strong></div>
      <button type="button" onClick={() => window.print()}>⎙ In hai mặt thẻ</button>
    </div>
    <div className="employee-card-print-area">
      <article className="employee-id-card employee-id-front">
        <div className="employee-card-orb employee-card-orb-one" /><div className="employee-card-orb employee-card-orb-two" />
        <header><InfinityBrandMark compact /><div><strong>INFINITY COMPANY</strong><small>EMPLOYEE IDENTITY CARD</small></div><b>STAFF</b></header>
        <div className="employee-card-front-body">
          <div className="employee-card-photo">{employee.photoKey ? <Image src={`/api/admin/hr-photo/${employee.adminUserId}`} alt={`Ảnh ${employee.name}`} width={132} height={156} unoptimized /> : <span>{employee.name.slice(0, 1).toUpperCase()}</span>}</div>
          <div className="employee-card-person">
            <div className="employee-card-info-row employee-card-name-row"><span>HỌ VÀ TÊN</span><strong>{employee.name}</strong></div>
            <div className="employee-card-info-row"><span>CHỨC VỤ</span><strong>{roleLabel(employee.role)}</strong></div>
            <div className="employee-card-info-row"><span>CHI NHÁNH</span><strong>{employee.branch || "Chưa phân chi nhánh"}</strong></div>
            <em>MÃ NHÂN VIÊN · {code}</em>
          </div>
          <div className="employee-card-qr">{qr ? <Image src={qr} alt={`QR nhân viên ${employee.name}`} width={104} height={104} unoptimized /> : <span>Đang tạo QR</span>}<small>QUÉT ĐỂ XÁC THỰC</small></div>
        </div>
      </article>

      <article className="employee-id-card employee-id-back">
        <div className="employee-card-back-band"><InfinityBrandMark compact /><div><strong>INFINITY COMPANY</strong><small>BUSINESS MANAGEMENT</small></div></div>
        <div className="employee-card-back-content">
          <p>Thẻ này là tài sản của Infinity Company và chỉ được sử dụng bởi nhân sự có tên ở mặt trước. Vui lòng hoàn trả thẻ khi nghỉ việc hoặc chuyển đơn vị công tác.</p>
          <EmployeeBarcode value={code} />
          <strong className="employee-card-code">{code}</strong>
          <div><span>Ngày tham gia: {formatDate(employee.joinedDate)}</span><span>INFINITY COMPANY · THẺ NHÂN SỰ</span></div>
        </div>
      </article>
    </div>
    <p className="employee-card-print-note">Khi in, chọn khổ A4, tỷ lệ 100% và bật in màu. Kích thước mỗi mặt thẻ chuẩn CR80: 85,6 × 53,98 mm.</p>
  </>;
}

function EmployeeBarcode({ value }: { value: string }) {
  const bars: Array<{ x: number; width: number }> = [];
  let cursor = 12;
  for (const character of `*${value}*`) {
    const pattern = digitPatterns[character];
    pattern.split("").forEach((widthType, index) => {
      const width = widthType === "w" ? 3 : 1;
      if (index % 2 === 0) bars.push({ x: cursor, width });
      cursor += width;
    });
    cursor += 1;
  }
  return <svg className="employee-card-barcode" viewBox={`0 0 ${cursor + 12} 54`} role="img" aria-label={`Mã vạch nhân viên ${value}`} preserveAspectRatio="none">
    <rect width={cursor + 12} height="54" fill="#fff" />
    {bars.map((bar, index) => <rect key={`${bar.x}-${index}`} x={bar.x} y="3" width={bar.width} height="48" fill="#082d50" />)}
  </svg>;
}

function employeeCode(id: string) {
  let hash = 2166136261;
  for (let index = 0; index < id.length; index += 1) hash = Math.imul(hash ^ id.charCodeAt(index), 16777619);
  return `89${String(hash >>> 0).padStart(10, "0")}`;
}
function roleLabel(role: string) { if (role === "manager") return "Quản lý chi nhánh"; if (role === "consultant") return "Nhân viên tư vấn"; if (role === "warranty") return "Nhân viên bảo hành"; if (role === "repair") return "Nhân viên sửa chữa"; return "Nhân viên bán hàng"; }
function formatDate(value: string) { return value ? new Date(`${value}T00:00:00`).toLocaleDateString("vi-VN") : "Chưa cập nhật"; }
