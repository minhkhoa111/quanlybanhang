import { faceBackend, faceError, requireFaceManager, scopedEmployees } from "../_backend";

export async function GET() {
  try {
    const manager = await requireFaceManager();
    const allowedIds = new Set((await scopedEmployees(manager)).map((employee) => employee.id));
    const result = await faceBackend("/employees") as { employees?: Array<{ employee_id: string }> };
    return Response.json({ ...result, employees: (result.employees || []).filter((employee) => allowedIds.has(employee.employee_id)) }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return faceError(error);
  }
}
