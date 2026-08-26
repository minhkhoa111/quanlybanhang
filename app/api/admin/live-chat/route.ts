import { requireAdminAction } from "@/app/admin-auth";
import { addLiveMessage, getAdminConversation, getAdminConversations, getLiveMessages, updateLiveConversation } from "@/db/live-chat";

const clean = (value: unknown, max = 500) => String(value || "").replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, max);

export async function GET(request: Request) {
  try {
    const admin = await requireAdminAction();
    if (!canUseLiveChat(admin.role) || (admin.role !== "owner" && !admin.branchId)) return Response.json({ message: "Tài khoản chưa được cấp quyền tư vấn chi nhánh." }, { status: 403 });
    const branchScope = admin.role === "owner" ? "" : admin.branchId;
    const id = clean(new URL(request.url).searchParams.get("conversationId"), 50);
    if (!id) return Response.json({ conversations: await getAdminConversations(branchScope) });
    const chat = await getAdminConversation(id, branchScope);
    if (!chat) return Response.json({ message: "Không tìm thấy hội thoại trong chi nhánh được phép." }, { status: 404 });
    return Response.json({ conversation: { ...chat, token: undefined }, messages: await getLiveMessages(id) }, { headers: { "Cache-Control": "no-store" } });
  } catch { return Response.json({ message: "Không có quyền truy cập." }, { status: 401 }); }
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdminAction();
    if (!canUseLiveChat(admin.role) || (admin.role !== "owner" && !admin.branchId)) return Response.json({ message: "Tài khoản chưa được cấp quyền tư vấn chi nhánh." }, { status: 403 });
    const body = await request.json() as Record<string, unknown>;
    const id = clean(body.conversationId, 50), action = clean(body.action, 20);
    const chat = await getAdminConversation(id, admin.role === "owner" ? "" : admin.branchId);
    if (!chat) return Response.json({ message: "Không tìm thấy hội thoại trong chi nhánh được phép." }, { status: 404 });
    if (action === "status") {
      const status = clean(body.status, 20);
      if (!["waiting", "active", "closed"].includes(status)) return Response.json({ message: "Trạng thái không hợp lệ." }, { status: 400 });
      await updateLiveConversation(id, status, admin.name); return Response.json({ ok: true });
    }
    const text = clean(body.text);
    if (!text) return Response.json({ message: "Tin nhắn trống." }, { status: 400 });
    await updateLiveConversation(id, "active", admin.name);
    await addLiveMessage(id, "admin", admin.name, text);
    return Response.json({ ok: true });
  } catch { return Response.json({ message: "Không có quyền truy cập." }, { status: 401 }); }
}

function canUseLiveChat(role: string) { return role === "owner" || role === "manager" || role === "consultant"; }
