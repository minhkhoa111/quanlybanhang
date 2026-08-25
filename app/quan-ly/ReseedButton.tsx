"use client";
import { useState } from "react";

export default function ReseedButton({ token = "dev-reseed-key" }: { token?: string }) {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function doReseed() {
    if (!confirm("Reset product DB from seed? This will delete current products.")) return;
    setLoading(true);
    setMsg(null);
    try {
      const resp = await fetch(`/api/admin/reseed?token=${encodeURIComponent(token)}`, {
        method: "POST",
      });
      if (!resp.ok) throw new Error(await resp.text());
      setMsg("Reseed completed.");
      // give the page a chance to reflect changes
      setTimeout(() => location.reload(), 800);
    } catch (err: unknown) {
      setMsg(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{marginTop:12}}>
      <button className="button button-danger" onClick={doReseed} disabled={loading}>
        {loading ? "Reseeding…" : "Re-seed products (dev)"}
      </button>
      {msg && <div style={{marginTop:8}}>{msg}</div>}
    </div>
  );
}
