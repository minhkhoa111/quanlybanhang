"use client";

import { useState } from "react";
import { bulkDeleteProductsAction } from "./actions";

export default function AdminBulkProducts({ children }: { children: React.ReactNode }) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  return (
    <div
      onChange={(event) => {
        const container = event.currentTarget;
        setSelectedIds(Array.from(container.querySelectorAll<HTMLInputElement>('input[name="ids"]:checked')).map((input) => input.value));
      }}
    >
      <form
        action={bulkDeleteProductsAction}
        onSubmit={(event) => {
          if (selectedIds.length === 0 || !confirm(`Xóa ${selectedIds.length} sản phẩm đã chọn?`)) event.preventDefault();
        }}
      >
        {selectedIds.map((id) => <input key={id} type="hidden" name="ids" value={id} />)}
        <div className="admin-bulkbar">
          <span>{selectedIds.length} sản phẩm được chọn</span>
          <button type="submit" className="admin-button admin-button-danger" disabled={selectedIds.length === 0}>Xóa sản phẩm đã chọn</button>
        </div>
      </form>
      {children}
    </div>
  );
}
