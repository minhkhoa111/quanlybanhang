import { faceBackend, faceError, readFacePayload, requireFaceManager, requireManagedEmployee } from "../_backend";

export async function POST(request: Request) {
  try {
    const manager = await requireFaceManager();
    const payload = await readFacePayload(request);
    await requireManagedEmployee(manager, payload.employee_id);
    const result = await faceBackend("/detect", { method: "POST", body: JSON.stringify(payload) });
    return Response.json(result, { headers: { "Cache-Control": "private, no-store, max-age=0" } });
  } catch (error) {
    return faceError(error);
  }
}
