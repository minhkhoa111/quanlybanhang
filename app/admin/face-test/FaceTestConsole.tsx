"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type ServerState = "checking" | "online" | "offline";
type FaceResult = {
  kind: "success" | "error";
  title: string;
  detail: string;
  confidence?: number;
  distance?: number;
};

export default function FaceTestConsole() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [serverUrl, setServerUrl] = useState("http://localhost:8001");
  const [employeeId, setEmployeeId] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [cameraOn, setCameraOn] = useState(false);
  const [busy, setBusy] = useState<"enroll" | "verify" | "">("");
  const [serverState, setServerState] = useState<ServerState>("checking");
  const [enrolledCount, setEnrolledCount] = useState<number | null>(null);
  const [message, setMessage] = useState<FaceResult | null>(null);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraOn(false);
  }, []);

  const checkServer = useCallback(async () => {
    setServerState("checking");
    try {
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 4000);
      const response = await fetch(`${cleanUrl(serverUrl)}/health`, { signal: controller.signal });
      window.clearTimeout(timeout);
      if (!response.ok) throw new Error("Máy chủ không phản hồi đúng.");
      const data = await response.json() as { ok?: boolean; enrolled_employees?: number };
      setServerState(data.ok ? "online" : "offline");
      setEnrolledCount(typeof data.enrolled_employees === "number" ? data.enrolled_employees : null);
    } catch {
      setServerState("offline");
      setEnrolledCount(null);
    }
  }, [serverUrl]);

  useEffect(() => {
    const timer = window.setTimeout(() => void checkServer(), 250);
    return () => window.clearTimeout(timer);
  }, [checkServer]);

  useEffect(() => stopCamera, [stopCamera]);

  async function startCamera() {
    setMessage(null);
    try {
      stopCamera();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraOn(true);
    } catch {
      setMessage({ kind: "error", title: "Không mở được camera", detail: "Hãy cấp quyền camera cho trình duyệt rồi thử lại." });
    }
  }

  async function submitFace(action: "enroll" | "verify") {
    if (!employeeId.trim()) {
      setMessage({ kind: "error", title: "Thiếu mã nhân viên", detail: "Nhập đúng mã nhân viên trước khi tiếp tục." });
      return;
    }
    if (!apiKey.trim()) {
      setMessage({ kind: "error", title: "Thiếu API key", detail: "Nhập FACE_API_KEY của máy chủ DeepFace." });
      return;
    }
    if (!videoRef.current || !cameraOn) {
      setMessage({ kind: "error", title: "Camera chưa sẵn sàng", detail: "Mở camera và đặt khuôn mặt vào giữa khung quét." });
      return;
    }

    setBusy(action);
    setMessage(null);
    try {
      const imageBase64 = captureFrame(videoRef.current);
      const response = await fetch(`${cleanUrl(serverUrl)}/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-API-Key": apiKey.trim() },
        body: JSON.stringify({ employee_id: employeeId.trim(), image_base64: imageBase64 }),
      });
      const data = await response.json() as { verified?: boolean; confidence?: number; distance?: number; message?: string; detail?: string };
      if (!response.ok) throw new Error(data.detail || "Máy chủ không thể xử lý ảnh khuôn mặt.");

      if (action === "enroll") {
        setMessage({ kind: "success", title: "Đăng ký khuôn mặt thành công", detail: `Đã cập nhật mẫu nhận diện cho ${employeeId.trim()}.` });
        void checkServer();
      } else if (data.verified) {
        setMessage({ kind: "success", title: "Xác minh trùng khớp", detail: data.message || `Đã nhận diện ${employeeId.trim()}.`, confidence: data.confidence, distance: data.distance });
      } else {
        setMessage({ kind: "error", title: "Khuôn mặt không trùng khớp", detail: data.message || "Hãy điều chỉnh ánh sáng và thử lại.", confidence: data.confidence, distance: data.distance });
      }
    } catch (error) {
      setMessage({ kind: "error", title: "Không thể xử lý yêu cầu", detail: error instanceof Error ? error.message : "Vui lòng thử lại." });
    } finally {
      setBusy("");
    }
  }

  return (
    <div className="face-test-page">
      <section className="face-test-workspace">
        <article className="face-test-camera-card">
          <header><div><span>Camera trực tiếp</span><h2>Khung nhận diện nhân viên</h2></div><p className={cameraOn ? "is-on" : ""}><i />{cameraOn ? "Camera đang hoạt động" : "Camera đang tắt"}</p></header>
          <div className={`face-test-viewport ${cameraOn ? "is-active" : ""}`}>
            <video ref={videoRef} autoPlay muted playsInline />
            {!cameraOn && <div className="face-test-empty"><span>◎</span><strong>Camera chưa được mở</strong><small>Cho phép quyền camera để bắt đầu kiểm thử</small></div>}
            {cameraOn && <><div className="face-test-frame"><i /><i /><i /><i /></div><div className="face-test-scan" /></>}
            <span className="face-test-secure">● Xử lý nội bộ · Không lưu ảnh gốc</span>
          </div>
          <footer><div><span>Gợi ý chất lượng ảnh</span><p>Giữ khuôn mặt thẳng, đủ sáng và cách camera khoảng 40–70 cm.</p></div><button type="button" className={cameraOn ? "is-stop" : ""} onClick={cameraOn ? stopCamera : startCamera}>{cameraOn ? "Tắt camera" : "Mở camera"}</button></footer>
        </article>

        <aside className="face-test-controls">
          <div className="face-test-server">
            <div className={`face-test-server-icon is-${serverState}`}>◉</div>
            <div><span>Máy chủ DeepFace</span><strong>{serverState === "online" ? "Đang kết nối" : serverState === "checking" ? "Đang kiểm tra…" : "Chưa kết nối"}</strong><small>{enrolledCount === null ? cleanUrl(serverUrl) : `${enrolledCount} nhân viên đã đăng ký`}</small></div>
            <button type="button" onClick={checkServer} aria-label="Kiểm tra lại máy chủ">↻</button>
          </div>
          <label className="face-test-field"><span>Địa chỉ máy chủ</span><input value={serverUrl} onChange={(event) => setServerUrl(event.target.value)} placeholder="http://localhost:8001" spellCheck={false} /></label>
          <label className="face-test-field"><span>Mã nhân viên</span><input value={employeeId} onChange={(event) => setEmployeeId(event.target.value)} placeholder="Ví dụ: NV-001" autoComplete="off" /></label>
          <label className="face-test-field"><span>API key bảo mật</span><input type="password" value={apiKey} onChange={(event) => setApiKey(event.target.value)} placeholder="Nhập FACE_API_KEY" autoComplete="off" /><small>Chỉ dùng trong phiên hiện tại, không lưu trên trình duyệt.</small></label>
          <div className="face-test-actions">
            <button type="button" className="face-test-enroll" disabled={Boolean(busy)} onClick={() => submitFace("enroll")}><span>＋</span><div><strong>{busy === "enroll" ? "Đang đăng ký…" : "Đăng ký khuôn mặt"}</strong><small>Tạo hoặc cập nhật mẫu nhân viên</small></div></button>
            <button type="button" className="face-test-verify" disabled={Boolean(busy)} onClick={() => submitFace("verify")}><span>✓</span><div><strong>{busy === "verify" ? "Đang xác minh…" : "Xác minh khuôn mặt"}</strong><small>So sánh với mẫu đã đăng ký</small></div></button>
          </div>
        </aside>
      </section>

      {message && <section className={`face-test-result is-${message.kind}`} role="status"><span>{message.kind === "success" ? "✓" : "!"}</span><div><strong>{message.title}</strong><p>{message.detail}</p></div>{typeof message.confidence === "number" && <dl><div><dt>Độ tin cậy</dt><dd>{Math.round(message.confidence * 100)}%</dd></div><div><dt>Khoảng cách</dt><dd>{message.distance?.toFixed(4) ?? "—"}</dd></div></dl>}</section>}

      <section className="face-test-guide"><header><span>Quy trình kiểm thử an toàn</span><h2>Ba bước để có kết quả chính xác</h2></header><div><article><i>01</i><span><strong>Kết nối máy chủ</strong><small>Khởi chạy Python AI tại cổng 8001 và nhập đúng API key.</small></span></article><article><i>02</i><span><strong>Định vị khuôn mặt</strong><small>Chỉ để một người trong khung hình, tránh ngược sáng và vật che mặt.</small></span></article><article><i>03</i><span><strong>Đăng ký hoặc xác minh</strong><small>Dùng cùng mã nhân viên khi tạo mẫu và kiểm tra trùng khớp.</small></span></article></div></section>
    </div>
  );
}

function cleanUrl(value: string) {
  return value.trim().replace(/\/+$/, "") || "http://localhost:8001";
}

function captureFrame(video: HTMLVideoElement) {
  if (!video.videoWidth || !video.videoHeight) throw new Error("Camera chưa tải xong khung hình.");
  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Trình duyệt không hỗ trợ chụp khung hình.");
  context.translate(canvas.width, 0);
  context.scale(-1, 1);
  context.drawImage(video, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.9);
}
