import { faceBackend, faceError, requireFaceManager, requireManagedEmployee } from "../../_backend";

export async function DELETE(_request: Request, context: { params: Promise<{ employeeId: string }> }) {
  try {
    const manager = await requireFaceManager();
    const { employeeId: rawEmployeeId } = await context.params;
    const employee = await requireManagedEmployee(manager, rawEmployeeId);
    const result = await faceBackend(`/employees/${encodeURIComponent(employee.id)}`, { method: "DELETE" });
    return Response.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return faceError(error);
  }
}
