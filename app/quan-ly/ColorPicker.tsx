"use client";

import React, { useEffect, useState } from "react";

type ColorOption = { name: string; hex: string };

const DEFAULT_PALETTE: ColorOption[] = [
  { name: "Đen", hex: "#111111" },
  { name: "Trắng", hex: "#ffffff" },
  { name: "Xám", hex: "#9b9b9b" },
  { name: "Xanh dương", hex: "#1e88e5" },
  { name: "Xanh lá", hex: "#43a047" },
  { name: "Đỏ", hex: "#e53935" },
  { name: "Vàng", hex: "#fbc02d" },
  { name: "Hồng", hex: "#f06292" },
];

export default function ColorPicker({
  name = "colors",
  initial = [],
  palette = DEFAULT_PALETTE,
}: {
  name?: string;
  initial?: string[] | ColorOption[];
  palette?: ColorOption[];
}) {
  const normalize = (v: string | ColorOption) => (typeof v === "string" ? v : v.hex);
  const initialHexes = (initial || []).map(normalize);
  const [selected, setSelected] = useState<string[]>(initialHexes.filter(Boolean));

  useEffect(() => {
    const input = document.querySelector<HTMLInputElement>(`input[name="${name}"]`);
    if (input) input.value = selected.join(", ");
  }, [name, selected]);

  function toggle(hex: string) {
    setSelected((prev) => (prev.includes(hex) ? prev.filter((h) => h !== hex) : [...prev, hex]));
  }

  return (
    <div className="admin-color-picker">
      <input type="hidden" name={name} value={selected.join(", ")} />
      <div className="color-palette">
        {palette.map((c) => (
          <button
            key={c.hex}
            type="button"
            aria-pressed={selected.includes(c.hex)}
            title={c.name}
            className={`color-swatch ${selected.includes(c.hex) ? "is-selected" : ""}`}
            onClick={() => toggle(c.hex)}>
            <span className="color-swatch-bg" style={{ backgroundColor: c.hex }} />
            {selected.includes(c.hex) && <svg className="check-icon" viewBox="0 0 24 24"><path fill="currentColor" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>}
          </button>
        ))}
      </div>
      <p className="admin-color-help">Chọn một hoặc nhiều màu để hiển thị cho sản phẩm.</p>
      <style jsx>{`
        .color-palette{display:flex;gap:8px;flex-wrap:wrap}
        .color-swatch{position:relative;width:36px;height:36px;border-radius:6px;border:none;cursor:pointer;padding:0;background:transparent;display:flex;align-items:center;justify-content:center;}
        .color-swatch-bg{position:absolute;inset:0;width:100%;height:100%;border-radius:inherit;border:2px solid rgba(0,0,0,0.1);transition:transform 150ms}
        .color-swatch:hover .color-swatch-bg{transform:scale(1.1)}
        .color-swatch.is-selected .color-swatch-bg{outline:2px solid var(--primary, #0070f3);border-color:transparent}
        .check-icon{position:relative;z-index:1;width:24px;height:24px;color:white;}
        .color-swatch[title="Trắng"] .check-icon, .color-swatch[title="Vàng"] .check-icon {color: #222;}
        .admin-color-help{margin-top:8px;font-size:0.9rem;color:var(--muted,#666)}
      `}</style>
    </div>
  );
}
