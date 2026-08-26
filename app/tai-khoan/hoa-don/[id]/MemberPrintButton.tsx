"use client";

export default function MemberPrintButton() {
  return <button type="button" className="button button-primary member-invoice-print-button" onClick={() => window.print()}>In / lưu PDF</button>;
}
