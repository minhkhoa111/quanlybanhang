import LiveChatInbox from "./LiveChatInbox";
export const dynamic="force-dynamic";
export default function Page(){return <><div className="admin-topline"><div><span>Hộp thư</span><h1>Tư vấn trực tiếp</h1></div><div className="admin-live-indicator"><i/> Online 08:00–22:00</div></div><LiveChatInbox/></>}
