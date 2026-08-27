import { faceBackend, faceError, readFacePayload, requireFaceManager, requireManagedEmployee } from "../_backend";

export async function POST(request: Request) {
  try {
    const manager = await requireFaceManager();
    const payload = await readFacePayload(request);
    await requireManagedEmployee(manager, payload.employee_id);
    const result = await faceBackend("/enroll", { method: "POST", body: JSON.stringify(payload) });
    return Response.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return faceError(error);
  }
}
