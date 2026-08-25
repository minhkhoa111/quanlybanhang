"use client";

export default function ReportPrintButton() {
  return <button className="admin-button" type="button" onClick={() => window.print()}>In báo cáo</button>;
}
