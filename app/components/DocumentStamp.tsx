type DocumentStampProps = {
  kind: "collected" | "disbursed";
  date: string;
};

export default function DocumentStamp({ kind, date }: DocumentStampProps) {
  const label = kind === "collected" ? "ĐÃ THU TIỀN" : "ĐÃ GIẢI NGÂN";
  return <div className={`document-stamp document-stamp-${kind}`} role="img" aria-label={`${label}${date ? ` ngày ${date}` : ""}`}>
    <span>INFINITY COMPANY</span>
    <strong>{label}</strong>
    <small>{date || "ĐÃ XÁC NHẬN"}</small>
  </div>;
}
