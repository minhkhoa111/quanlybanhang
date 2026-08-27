"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type Employee = { id: string; name: string; role: string; branch: string; active: boolean };
type Registration = { employee_id: string; model_name: string; created_at: number; updated_at: number };
type FaceResult = { kind: "success" | "error"; title: string; detail: string; confidence?: number; distance?: number };
type FaceAction = "enroll" | "verify";
type FaceBox = { left: number; top: number; width: number; height: number };
type FacialArea = { x?: number; y?: number; w?: number; h?: number; image_width?: number; image_height?: number };
type BrowserFaceDetector = { detect(source: HTMLVideoElement): Promise<Array<{ boundingBox: { x: number; y: number; width: number; height: number } }>> };

export default function FaceTestConsole({ employees, scopeLabel }: { employees: Employee[]; scopeLabel: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const cameraCardRef = useRef<HTMLElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectorAvailableRef = useRef(false);
  const facePresentRef = useRef(false);
  const detectionRequestRef = useRef(false);
  const [cameraOn, setCameraOn] = useState(false);
  const [busy, setBusy] = useState<"enroll" | "verify" | "delete" | "">("");
  const [pendingAction, setPendingAction] = useState<FaceAction | "">("");
  const [serverState, setServerState] = useState<"checking" | "online" | "offline">("checking");
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(employees.find((employee) => employee.active)?.id || "");
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [message, setMessage] = useState<FaceResult | null>(null);
  const [faceBox, setFaceBox] = useState<FaceBox | null>(null);

  const registeredIds = useMemo(() => new Set(registrations.map((item) => item.employee_id)), [registrations]);
  const selectedEmployee = employees.find((employee) => employee.id === selectedEmployeeId);
  const selectedEmployeeName = selectedEmployee?.name || "nhân viên";
  const selectedRegistered = registeredIds.has(selectedEmployeeId);
  const visibleEmployees = employees.filter((employee) => {
    const matchesKeyword = `${employee.name} ${employee.branch} ${roleLabel(employee.role)}`.toLocaleLowerCase("vi-VN").includes(keyword.trim().toLocaleLowerCase("vi-VN"));
    const registered = registeredIds.has(employee.id);
    return matchesKeyword && (statusFilter === "all" || (statusFilter === "registered" ? registered : !registered));
  });

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraOn(false);
    setFaceBox(null);
    setPendingAction("");
    facePresentRef.current = false;
  }, []);

  const loadRegistrations = useCallback(async () => {
    setServerState("checking");
    try {
      const response = await fetch("/api/face/employees", { cache: "no-store" });
      const data = await response.json() as { employees?: Registration[]; message?: string };
      if (!response.ok) throw new Error(data.message || "Không kết nối được DeepFace.");
      setRegistrations(Array.isArray(data.employees) ? data.employees : []);
      setServerState("online");
    } catch {
      setServerState("offline");
      setRegistrations([]);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadRegistrations(), 100);
    return () => window.clearTimeout(timer);
  }, [loadRegistrations]);
  useEffect(() => stopCamera, [stopCamera]);

  async function startCamera(employee?: Employee) {
    if (employee) setSelectedEmployeeId(employee.id);
    setMessage(null);
    setFaceBox(null);
    facePresentRef.current = false;
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
      cameraCardRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      return true;
    } catch {
      setMessage({ kind: "error", title: "Không mở được camera", detail: "Hãy cấp quyền camera cho localhost:3000 rồi thử lại." });
      return false;
    }
  }

  useEffect(() => {
    if (!cameraOn) return;
    const Detector = (window as unknown as { FaceDetector?: new (options?: { fastMode?: boolean; maxDetectedFaces?: number }) => BrowserFaceDetector }).FaceDetector;
    if (!Detector) { detectorAvailableRef.current = false; return; }
    detectorAvailableRef.current = true;
    const detector = new Detector({ fastMode: true, maxDetectedFaces: 1 });
    let active = true;
    let detecting = false;
    let misses = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const track = async () => {
      const video = videoRef.current;
      const viewport = viewportRef.current;
      if (!active || !video || !viewport || detecting || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
        if (active) timer = setTimeout(track, 180);
        return;
      }
      detecting = true;
      try {
        const faces = await detector.detect(video);
        if (faces[0]) {
          misses = 0;
          facePresentRef.current = true;
          setFaceBox(mapSquareFaceBox(faces[0].boundingBox, video.videoWidth, video.videoHeight, viewport.clientWidth, viewport.clientHeight, true));
        } else {
          misses += 1;
          if (misses >= 4) { facePresentRef.current = false; setFaceBox(null); }
        }
      } catch {
        detectorAvailableRef.current = false;
        active = false;
      } finally {
        detecting = false;
        if (active) timer = setTimeout(track, 180);
      }
    };
    void track();
    return () => { active = false; if (timer) clearTimeout(timer); };
  }, [cameraOn]);

  useEffect(() => {
    if (!cameraOn || !selectedEmployeeId || busy) return;
    let active = true;
    let misses = 0;
    const detectWithServer = async () => {
      const video = videoRef.current;
      const viewport = viewportRef.current;
      if (!active || !video || !viewport || detectionRequestRef.current || (detectorAvailableRef.current && facePresentRef.current) || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return;
      detectionRequestRef.current = true;
      try {
        const controller = new AbortController();
        const timeout = window.setTimeout(() => controller.abort(), 2500);
        const response = await fetch("/api/face/detect", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ employee_id: selectedEmployeeId, image_base64: captureFrame(video, 640, 0.72) }), signal: controller.signal }).finally(() => window.clearTimeout(timeout));
        const data = await response.json().catch(() => ({})) as { facial_area?: FacialArea };
        if (!response.ok || !data.facial_area) throw new Error("face-not-found");
        misses = 0;
        facePresentRef.current = true;
        updateFaceTestBox(data.facial_area, video, viewport, setFaceBox);
      } catch {
        misses += 1;
        if (misses >= 2) { facePresentRef.current = false; setFaceBox(null); }
      } finally {
        detectionRequestRef.current = false;
      }
    };
    const first = setTimeout(() => void detectWithServer(), 120);
    const interval = setInterval(() => void detectWithServer(), 400);
    return () => { active = false; clearTimeout(first); clearInterval(interval); };
  }, [busy, cameraOn, selectedEmployeeId]);

  const runFaceAction = useCallback(async (action: FaceAction, employeeId: string, employeeName: string) => {
    const video = videoRef.current;
    if (!video || !employeeId) return;
    setPendingAction("");
    setBusy(action);
    setMessage(null);
    try {
      const response = await fetch(`/api/face/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employee_id: employeeId, image_base64: captureFrame(video) }),
      });
      const data = await response.json() as { verified?: boolean; confidence?: number; distance?: number; message?: string; facial_area?: FacialArea };
      if (data.facial_area) updateFaceTestBox(data.facial_area, video, viewportRef.current, setFaceBox);
      if (!response.ok) throw new Error(data.message || "Không thể xử lý ảnh khuôn mặt.");

      if (action === "enroll") {
        setMessage({ kind: "success", title: "Đã thêm khuôn mặt", detail: `Mẫu nhận diện chính diện của ${employeeName} đã được lưu. Có thể xác minh khi đeo mắt kính trong suốt.` });
        await loadRegistrations();
      } else if (data.verified) {
        setMessage({ kind: "success", title: "Xác minh thành công", detail: data.message || `Đã nhận diện ${employeeName}.`, confidence: data.confidence, distance: data.distance });
      } else {
        setMessage({ kind: "error", title: "Xác minh không thành công", detail: data.message || "Điều chỉnh khuôn mặt để camera quét.", confidence: data.confidence, distance: data.distance });
      }
    } catch (error) {
      setMessage({ kind: "error", title: action === "enroll" ? "Đăng ký không thành công" : "Xác minh không thành công", detail: `Điều chỉnh khuôn mặt để camera quét. ${error instanceof Error ? error.message : "Vui lòng thử lại."}` });
    } finally {
      setBusy("");
    }
  }, [loadRegistrations]);

  const faceLocated = Boolean(faceBox);
  useEffect(() => {
    if (!cameraOn || !pendingAction || busy) return;
    const stableTimer = window.setTimeout(() => {
      void runFaceAction(pendingAction, selectedEmployeeId, selectedEmployeeName);
    }, faceLocated ? 350 : 1200);
    return () => window.clearTimeout(stableTimer);
  }, [busy, cameraOn, faceLocated, pendingAction, runFaceAction, selectedEmployeeId, selectedEmployeeName]);

  async function submitFace(action: FaceAction) {
    if (!selectedEmployeeId) {
      setMessage({ kind: "error", title: "Chưa chọn nhân viên", detail: "Chọn một nhân viên trong danh sách trước khi tiếp tục." });
      return;
    }
    if (!videoRef.current || !cameraOn) {
      setMessage(null);
      const opened = await startCamera();
      if (opened) setPendingAction(action);
      return;
    }
    if (!facePresentRef.current) {
      setMessage(null);
      setPendingAction(action);
      return;
    }
    await runFaceAction(action, selectedEmployeeId, selectedEmployeeName);
  }

  async function deleteRegistration(employee: Employee) {
    if (!window.confirm(`Xóa mẫu khuôn mặt của ${employee.name}? Nhân viên sẽ phải đăng ký lại trước khi xác minh.`)) return;
    setBusy("delete");
    setSelectedEmployeeId(employee.id);
    try {
      const response = await fetch(`/api/face/employees/${encodeURIComponent(employee.id)}`, { method: "DELETE" });
      const data = await response.json() as { message?: string };
      if (!response.ok) throw new Error(data.message || "Không thể xóa dữ liệu khuôn mặt.");
      setMessage({ kind: "success", title: "Đã xóa mẫu khuôn mặt", detail: `${employee.name} hiện được chuyển về trạng thái chưa đăng ký.` });
      await loadRegistrations();
    } catch (error) {
      setMessage({ kind: "error", title: "Không thể xóa mẫu khuôn mặt", detail: error instanceof Error ? error.message : "Vui lòng thử lại." });
    } finally {
      setBusy("");
    }
  }

  return (
    <div className="face-test-page">
      <section className="face-test-workspace">
        <article className="face-test-camera-card" ref={cameraCardRef}>
          <header><div><span>Camera trực tiếp</span><h2>{selectedEmployee ? `Nhận diện · ${selectedEmployee.name}` : "Khung nhận diện nhân viên"}</h2></div><p className={cameraOn ? "is-on" : ""}><i />{cameraOn ? "Camera đang hoạt động" : "Camera đang tắt"}</p></header>
          <div ref={viewportRef} className={`face-test-viewport ${cameraOn ? "is-active" : ""}`}>
            <video ref={videoRef} autoPlay muted playsInline />
            {!cameraOn && <div className="face-test-empty"><span>◎</span><strong>Camera chưa được mở</strong><small>Chọn nhân viên và cho phép quyền camera để bắt đầu</small></div>}
            {cameraOn && <><div className={`face-test-tracker ${faceBox ? "is-tracking" : "is-searching"}`} style={faceBox ? { left: faceBox.left, top: faceBox.top, width: faceBox.width, height: faceBox.height } : undefined}><div className="face-test-frame"><i /><i /><i /><i /></div><div className="face-test-camera-status"><span className={message ? `is-${message.kind}` : busy || pendingAction ? "is-busy" : faceBox ? "is-ready" : ""}>{message?.kind === "success" ? "✓" : message?.kind === "error" ? "×" : busy || pendingAction ? "◎" : faceBox ? "✓" : "◎"}</span><div><strong>{message?.title || (busy === "enroll" ? "Đang lưu khuôn mặt" : busy === "verify" ? "Đang xác minh" : pendingAction && faceBox ? "Giữ khuôn mặt ổn định" : pendingAction ? "Đang tìm khuôn mặt" : faceBox ? "Đã tìm thấy khuôn mặt" : "Đang tìm khuôn mặt")}</strong><small>{message?.detail || (pendingAction && faceBox ? "Hệ thống sẽ tự chụp và xử lý, không cần bấm lại." : pendingAction ? "Đưa khuôn mặt vào camera để hệ thống tự quét." : faceBox ? "Khung đang tự bám theo khuôn mặt." : "Di chuyển khuôn mặt vào vùng camera để quét.")}</small></div></div></div><div className="face-test-scan" /></>}
            <span className="face-test-secure">● Gửi qua proxy bảo mật · Không lộ API key</span>
          </div>
          <footer><div><span>Gợi ý chất lượng ảnh</span><p>Giữ khuôn mặt thẳng, đủ sáng và cách camera khoảng 40–70 cm.</p></div><button type="button" className={cameraOn ? "is-stop" : ""} onClick={cameraOn ? stopCamera : () => void startCamera()}>{cameraOn ? "Tắt camera" : "Mở camera"}</button></footer>
        </article>

        <aside className="face-test-controls">
          <div className="face-test-server">
            <div className={`face-test-server-icon is-${serverState}`}>◉</div>
            <div><span>Máy chủ DeepFace</span><strong>{serverState === "online" ? "Đang kết nối" : serverState === "checking" ? "Đang kiểm tra…" : "Chưa kết nối"}</strong><small>{serverState === "online" ? `${registrations.length} nhân viên đã đăng ký` : "Kết nối được bảo vệ qua Next.js"}</small></div>
            <button type="button" onClick={loadRegistrations} aria-label="Kiểm tra lại máy chủ">↻</button>
          </div>
          <label className="face-test-field"><span>Nhân viên đang thao tác</span><select value={selectedEmployeeId} onChange={(event) => { setSelectedEmployeeId(event.target.value); setPendingAction(""); setMessage(null); }}><option value="">Chọn nhân viên</option>{employees.map((employee) => <option key={employee.id} value={employee.id}>{employee.name} · {employee.branch}</option>)}</select></label>
          {selectedEmployee && <div className="face-test-selected"><span className="face-test-person-avatar">{selectedEmployee.name.charAt(0).toUpperCase()}</span><div><strong>{selectedEmployee.name}</strong><small>{roleLabel(selectedEmployee.role)} · {selectedEmployee.branch || "Chưa phân chi nhánh"}</small></div><em className={selectedRegistered ? "is-registered" : ""}>{selectedRegistered ? "Đã đăng ký" : "Chưa đăng ký"}</em></div>}
          <div className="face-test-privacy"><span>⚿</span><p><strong>Thông tin kết nối được bảo vệ</strong><small>Địa chỉ máy chủ và FACE_API_KEY chỉ tồn tại ở server, không gửi xuống trình duyệt.</small></p></div>
          <div className="face-test-actions">
            <button type="button" className="face-test-enroll" disabled={Boolean(busy) || Boolean(pendingAction) || !selectedEmployee} onClick={() => void submitFace("enroll")}><span>{selectedRegistered ? "↻" : "＋"}</span><div><strong>{busy === "enroll" ? "Đang xử lý ảnh…" : pendingAction === "enroll" ? "Đang tự tìm khuôn mặt…" : selectedRegistered ? "Cập nhật khuôn mặt" : "Đăng ký khuôn mặt"}</strong><small>{cameraOn ? "Một lần chụp chính diện · hỗ trợ mắt kính" : "Camera sẽ tự mở khi bắt đầu"}</small></div></button>
            <button type="button" className="face-test-verify" disabled={Boolean(busy) || Boolean(pendingAction) || !selectedRegistered} onClick={() => void submitFace("verify")}><span>✓</span><div><strong>{busy === "verify" ? "Đang xác minh…" : pendingAction === "verify" ? "Đang tự tìm khuôn mặt…" : "Xác minh khuôn mặt"}</strong><small>{selectedRegistered ? "Tự so sánh khi khuôn mặt ổn định" : "Cần đăng ký khuôn mặt trước"}</small></div></button>
          </div>
        </aside>
      </section>

      {message && !cameraOn && <section className={`face-test-result is-${message.kind}`} role="status"><span>{message.kind === "success" ? "✓" : "!"}</span><div><strong>{message.title}</strong><p>{message.detail}</p></div>{typeof message.confidence === "number" && <dl><div><dt>Độ tin cậy</dt><dd>{Math.round(message.confidence * 100)}%</dd></div><div><dt>Khoảng cách</dt><dd>{message.distance?.toFixed(4) ?? "—"}</dd></div></dl>}</section>}

      <section className="face-test-directory">
        <header><div><span>Quản lý dữ liệu khuôn mặt · {scopeLabel}</span><h2>Danh sách nhân viên</h2><p>{employees.length} hồ sơ · {registrations.length} đã đăng ký mẫu nhận diện</p></div><div className="face-test-directory-filters"><label><span>⌕</span><input value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="Tìm tên, vai trò, chi nhánh…" /></label><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="all">Tất cả trạng thái</option><option value="registered">Đã đăng ký</option><option value="missing">Chưa đăng ký</option></select></div></header>
        <div className="face-test-table-wrap"><table><thead><tr><th>Nhân viên</th><th>Vai trò</th><th>Chi nhánh</th><th>Trạng thái khuôn mặt</th><th>Cập nhật gần nhất</th><th>Thao tác</th></tr></thead><tbody>{visibleEmployees.map((employee) => { const registration = registrations.find((item) => item.employee_id === employee.id); return <tr key={employee.id} className={selectedEmployeeId === employee.id ? "is-selected" : ""}><td><span className="face-test-person-avatar">{employee.name.charAt(0).toUpperCase()}</span><div><strong>{employee.name}</strong><small>{employee.active ? "Đang hoạt động" : "Đã vô hiệu hóa"}</small></div></td><td>{roleLabel(employee.role)}</td><td>{employee.branch || "Chưa phân chi nhánh"}</td><td><em className={registration ? "is-registered" : ""}><i />{registration ? "Đã đăng ký" : "Chưa đăng ký"}</em></td><td>{registration ? formatTimestamp(registration.updated_at) : "—"}</td><td><div className="face-test-row-actions"><button type="button" onClick={() => void startCamera(employee)}>{registration ? "Cập nhật" : "Đăng ký"}</button>{registration && <button type="button" className="is-delete" disabled={Boolean(busy)} onClick={() => void deleteRegistration(employee)}>Xóa</button>}</div></td></tr>; })}</tbody></table>{!visibleEmployees.length && <div className="face-test-no-results">Không tìm thấy nhân viên phù hợp với bộ lọc.</div>}</div>
      </section>

      <section className="face-test-guide"><header><span>Quy trình kiểm thử an toàn</span><h2>Ba bước để có kết quả chính xác</h2></header><div><article><i>01</i><span><strong>Chọn nhân viên</strong><small>Dùng đúng hồ sơ nhân sự để liên kết mẫu khuôn mặt.</small></span></article><article><i>02</i><span><strong>Nhìn thẳng camera</strong><small>Giữ khuôn mặt rõ, đủ sáng; có thể đeo kính trong suốt.</small></span></article><article><i>03</i><span><strong>Đăng ký hoặc xác minh</strong><small>Ảnh được chuyển tự động qua API bảo mật và không lưu trong trình duyệt.</small></span></article></div></section>
    </div>
  );
}

function captureFrame(video: HTMLVideoElement, maxWidth = 1280, quality = 0.88) {
  if (!video.videoWidth || !video.videoHeight) throw new Error("Camera chưa tải xong khung hình.");
  const canvas = document.createElement("canvas");
  const scale = Math.min(1, maxWidth / video.videoWidth);
  canvas.width = Math.round(video.videoWidth * scale);
  canvas.height = Math.round(video.videoHeight * scale);
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Trình duyệt không hỗ trợ chụp khung hình.");
  context.translate(canvas.width, 0);
  context.scale(-1, 1);
  context.drawImage(video, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", quality);
}

function updateFaceTestBox(area: FacialArea, video: HTMLVideoElement, viewport: HTMLDivElement | null, update: (box: FaceBox) => void) {
  if (!viewport || !area.w || !area.h) return;
  const sourceWidth = area.image_width || video.videoWidth;
  const sourceHeight = area.image_height || video.videoHeight;
  if (!sourceWidth || !sourceHeight) return;
  update(mapSquareFaceBox({ x: area.x || 0, y: area.y || 0, width: area.w, height: area.h }, sourceWidth, sourceHeight, viewport.clientWidth, viewport.clientHeight, false));
}

function mapSquareFaceBox(rect: { x: number; y: number; width: number; height: number }, sourceWidth: number, sourceHeight: number, viewportWidth: number, viewportHeight: number, mirrored: boolean): FaceBox {
  const scale = Math.max(viewportWidth / sourceWidth, viewportHeight / sourceHeight);
  const offsetX = (viewportWidth - sourceWidth * scale) / 2;
  const offsetY = (viewportHeight - sourceHeight * scale) / 2;
  const sourceX = mirrored ? sourceWidth - rect.x - rect.width : rect.x;
  const centerX = offsetX + (sourceX + rect.width / 2) * scale;
  const centerY = offsetY + (rect.y + rect.height / 2) * scale;
  const side = Math.min(viewportWidth - 20, viewportHeight - 80, Math.max(rect.width * scale * 1.55, rect.height * scale * 1.3));
  return {
    left: clamp(centerX - side / 2, 10, viewportWidth - side - 10),
    top: clamp(centerY - side / 2, 10, viewportHeight - side - 68),
    width: side,
    height: side,
  };
}
function clamp(value: number, minimum: number, maximum: number) { return Math.max(minimum, Math.min(Math.max(minimum, maximum), value)); }

function roleLabel(role: string) {
  if (role === "manager") return "Quản lý chi nhánh";
  if (role === "consultant") return "Nhân viên tư vấn";
  if (role === "warranty") return "Nhân viên bảo hành";
  if (role === "repair") return "Nhân viên sửa chữa";
  if (role === "owner") return "Giám đốc";
  return "Nhân viên bán hàng";
}

function formatTimestamp(timestamp: number) {
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short", timeZone: "Asia/Ho_Chi_Minh" }).format(new Date(timestamp * 1000));
}
