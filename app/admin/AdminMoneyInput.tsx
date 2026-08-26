"use client";

import { useState } from "react";

export default function AdminMoneyInput({ name, initialValue, placeholder = "0" }: { name: string; initialValue?: number; placeholder?: string }) {
  const [value, setValue] = useState(Math.max(0, Math.round(initialValue || 0)));
  return <input name={name} type="text" inputMode="numeric" value={value ? value.toLocaleString("vi-VN") : ""} placeholder={placeholder} onChange={(event) => setValue(Number(event.target.value.replace(/\D/g, "")) || 0)}/>;
}
