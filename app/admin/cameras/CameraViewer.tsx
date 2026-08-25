"use client";

import { useEffect, useState } from "react";
import type { Camera } from "@/db/cameras";

export default function CameraViewer({ camera }: { camera: Camera }) {
  const [enabled, setEnabled] = useState(false);
  const [snapshotVersion, setSnapshotVersion] = useState(0);

  useEffect(() => {
    if (!enabled || camera.streamType !== "snapshot") return;
    const timer = window.setInterval(() => setSnapshotVersion((value) => value + 1), 10_000);
    return () => window.clearInterval(timer);
  }, [camera.streamType, enabled]);

  return (
    <div className="camera-stage">
      {!enabled ? (
        <div className="camera-placeholder">
          <span className="camera-lens" aria-hidden="true" />
          <strong>{camera.active ? "Camera đang sẵn sàng" : "Camera đang tạm ngưng"}</strong>
          <p>Luồng chỉ được kết nối sau khi người có quyền chủ động bật xem.</p>
          <button type="button" onClick={() => setEnabled(true)} disabled={!camera.active}>
            Bật camera
          </button>
        </div>
      ) : (
        <>
          {camera.streamType === "video" && (
            <video src={camera.streamUrl} controls autoPlay muted playsInline aria-label={`Camera ${camera.name}`} />
          )}
          {camera.streamType === "snapshot" && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={withCacheBuster(camera.streamUrl, snapshotVersion)} alt={`Ảnh từ camera ${camera.name}`} />
          )}
          {camera.streamType === "embed" && (
            <iframe
              src={camera.streamUrl}
              title={`Camera ${camera.name}`}
              allow="autoplay; fullscreen"
              referrerPolicy="no-referrer"
            />
          )}
          <button className="camera-stop" type="button" onClick={() => setEnabled(false)}>
            Tắt luồng
          </button>
        </>
      )}
    </div>
  );
}

function withCacheBuster(url: string, version: number) {
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}camera_refresh=${version}`;
}
