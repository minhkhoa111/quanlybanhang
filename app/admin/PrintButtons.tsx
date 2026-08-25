"use client";

export default function PrintButtons() {
  function printDocument(type: "order" | "invoice") {
    document.body.dataset.printDocument = type;
    window.print();
    delete document.body.dataset.printDocument;
  }

  return (
    <>
      <button className="admin-button" type="button" onClick={() => printDocument("order")}>In đơn hàng</button>
      <button className="admin-button admin-button-primary" type="button" onClick={() => printDocument("invoice")}>In hóa đơn</button>
    </>
  );
}
