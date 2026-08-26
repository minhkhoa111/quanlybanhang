import LiveChatInbox from "./LiveChatInbox";
import { redirect } from "next/navigation";
import { requireAdminPage } from "@/app/admin-auth";
export const dynamic="force-dynamic";
export default async function Page(){const user=await requireAdminPage("/admin/live-chat");if(!["owner","manager","consultant"].includes(user.role))redirect("/staff");return <><div className="admin-topline"><div><span>Hộp thư · {user.role==="owner"?"Toàn hệ thống":user.branch}</span><h1>Tư vấn trực tiếp theo chi nhánh</h1><p className="admin-subtitle">{user.role==="owner"?"Theo dõi hội thoại của mọi chi nhánh.":`Chỉ hiển thị khách đã chọn ${user.branch}.`}</p></div><div className="admin-live-indicator"><i/> Online 08:00–22:00</div></div><LiveChatInbox/></>}
