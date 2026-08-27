"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { createBotReply } from "@/app/chatbot/engine";
import type { ChatContext, ChatMessage, ChatProduct } from "@/app/chatbot/types";
import { CHATBOT_OPENING, CHATBOT_QUICK_REPLIES } from "@/app/data/chatbotKnowledge";
import LiveSupportChat from "@/app/components/LiveSupportChat";

const STORAGE_KEY = "huy-apple-local-chat-v1";
const INITIAL_MESSAGE: ChatMessage = {
  id: "chatbot-welcome",
  role: "bot",
  text: CHATBOT_OPENING,
  createdAt: 0,
  intent: "greeting",
  confidence: 1,
};

type StoredChat = { messages: ChatMessage[]; context: ChatContext };

export default function LocalChatbot({ products }: { products: ChatProduct[] }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE]);
  const [context, setContext] = useState<ChatContext>({});
  const [typing, setTyping] = useState(false);
  const [ready, setReady] = useState(false);
  const [staffOnline, setStaffOnline] = useState(false);
  const [liveActive, setLiveActive] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateStatus = () => setStaffOnline(isVietnamSupportHours());
    updateStatus();
    const timer = window.setInterval(updateStatus, 60_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const restore = window.setTimeout(() => {
      try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null") as StoredChat | null;
        if (saved && Array.isArray(saved.messages)) {
          const validMessages = saved.messages.filter(validMessage).slice(-40);
          if (validMessages.length) setMessages(validMessages);
          if (saved.context && typeof saved.context === "object") setContext(saved.context);
        }
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
      setReady(true);
    }, 0);
    return () => window.clearTimeout(restore);
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ messages: messages.slice(-40), context } satisfies StoredChat));
  }, [context, messages, ready]);

  useEffect(() => {
    if (!open) return;
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open, typing]);

  const showQuickReplies = useMemo(() => {
    const last = messages[messages.length - 1];
    return messages.length <= 2 || last?.intent === "unknown" || last?.intent === "products";
  }, [messages]);

  if (pathname.startsWith("/admin")) return null;

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    sendMessage(input);
  }

  function sendMessage(rawMessage: string) {
    const text = rawMessage.replace(/[\u0000-\u001F\u007F]/g, " ").replace(/\s+/g, " ").trim().slice(0, 300);
    if (!text || typing) return;

    const reply = createBotReply(text, products, context);
    const userMessage: ChatMessage = { id: newId(), role: "user", text, createdAt: 0 };
    setMessages((current) => [...current, userMessage]);
    setInput("");
    setContext(reply.context);
    setTyping(true);

    window.setTimeout(async () => {
      const resolvedText = reply.orderCode ? await lookupOrderStatus(reply.orderCode) : reply.text;
      const botMessage: ChatMessage = {
        id: newId(),
        role: "bot",
        text: resolvedText,
        createdAt: Date.now(),
        intent: reply.intent,
        confidence: reply.confidence,
        link: reply.link,
      };
      setMessages((current) => [...current, botMessage]);
      setTyping(false);
    }, 650 + Math.min(550, text.length * 7));
  }

  function clearConversation() {
    setMessages([INITIAL_MESSAGE]);
    setContext({});
    setTyping(false);
    localStorage.removeItem(STORAGE_KEY);
  }

  return (
    <aside className={`local-chatbot${open ? " is-open" : ""}`} aria-label="Trợ lý tư vấn Infinity Company">
      {open ? (
        <section className="chatbot-panel" role="dialog" aria-modal="false" aria-labelledby="chatbot-title">
          <header className="chatbot-header">
            <div className="chatbot-brand-mark" aria-hidden="true">
              <Image src="/chatbot/consultant-avatar.png" alt="" width={52} height={52} unoptimized />
            </div>
            <div>
              <strong id="chatbot-title">Trợ lý tư vấn</strong>
              <span><i aria-hidden="true" />Đang trực tuyến</span>
            </div>
            <button type="button" onClick={() => setOpen(false)} aria-label="Thu nhỏ cửa sổ chat" title="Thu nhỏ">−</button>
            <button type="button" onClick={() => setOpen(false)} aria-label="Đóng cửa sổ chat" title="Đóng">×</button>
          </header>

          <div className="chatbot-messages" ref={listRef} aria-live="polite" aria-busy={typing}>
            <div className="chatbot-local-note">Tư vấn tự động từ dữ liệu nội bộ của Infinity Company</div>
            {messages.map((message) => (
              <article key={message.id} className={`chatbot-message is-${message.role}`}>
                {message.role === "bot" && <Image className="chatbot-avatar" src="/chatbot/consultant-avatar.png" alt="" width={28} height={28} unoptimized />}
                <div>
                  <p>{message.text}</p>
                  {message.link && <Link href={message.link.href} onClick={() => setOpen(false)}>{message.link.label}<span aria-hidden="true">→</span></Link>}
                </div>
              </article>
            ))}
            {typing && (
              <article className="chatbot-message is-bot is-typing" aria-label="Trợ lý đang nhập">
                <Image className="chatbot-avatar" src="/chatbot/consultant-avatar.png" alt="" width={28} height={28} unoptimized />
                <div><i /><i /><i /></div>
              </article>
            )}
          </div>

          {showQuickReplies && (
            <div className="chatbot-quick-replies" aria-label="Câu hỏi gợi ý">
              {CHATBOT_QUICK_REPLIES.map((reply) => <button key={reply} type="button" onClick={() => sendMessage(reply)} disabled={typing}>{reply}</button>)}
            </div>
          )}

          <form className="chatbot-composer" onSubmit={submit}>
            <label className="sr-only" htmlFor="chatbot-input">Nhập câu hỏi</label>
            <input id="chatbot-input" value={input} onChange={(event) => setInput(event.target.value)} placeholder="Nhập câu hỏi..." maxLength={300} autoComplete="off" />
            <button type="submit" disabled={!input.trim() || typing} aria-label="Gửi tin nhắn" title="Gửi">↑</button>
          </form>
          <button className="chatbot-reset" type="button" onClick={clearConversation}>Xóa cuộc trò chuyện</button>
        </section>
      ) : (
        <div className="chatbot-launchers">
          <LiveSupportChat online={staffOnline} onActiveChange={setLiveActive} />
          {!liveActive && <button className="chatbot-launcher" type="button" onClick={() => setOpen(true)} aria-label="Mở trợ lý tư vấn tự động">
            <span className="chatbot-launcher-icon" aria-hidden="true">
              <Image src="/chatbot/consultant-avatar.png" alt="" width={54} height={54} unoptimized />
            </span>
            <span><strong>Tư vấn cùng Huy</strong><small>Trợ lý tự động · Phản hồi 24/7</small></span>
            <i aria-hidden="true" />
          </button>}
        </div>
      )}
    </aside>
  );
}

async function lookupOrderStatus(orderCode: string) {
  try {
    const response = await fetch(`/api/orders/status?orderCode=${encodeURIComponent(orderCode)}`, { cache: "no-store" });
    const result = await response.json() as { status?: string; paymentStatus?: string; message?: string };
    if (!response.ok) return result.message || "Mình chưa tìm thấy đơn hàng này. Bạn hãy kiểm tra lại mã đơn.";
    return `Đơn ${orderCode}: ${orderStatusLabel(result.status)}. Thanh toán: ${paymentStatusLabel(result.paymentStatus)}.`;
  } catch {
    return "Hiện chưa thể đọc trạng thái đơn hàng. Bạn có thể gọi hoặc nhắn Zalo 02879797999 để được kiểm tra.";
  }
}

function orderStatusLabel(status?: string) {
  return ({ pending: "đã tiếp nhận", confirmed: "đã xác nhận", processing: "đang chuẩn bị", shipping: "đang giao", delivered: "đã giao", cancelled: "đã hủy", returned: "đã hoàn trả" } as Record<string, string>)[status ?? ""] || "đang được kiểm tra";
}

function paymentStatusLabel(status?: string) {
  return ({ not_required: "không cần thanh toán, đang chờ nhân viên tư vấn", unpaid: "chưa thanh toán", paid: "đã thanh toán", pending: "đang kiểm tra", failed: "thanh toán lỗi", refunded: "đã hoàn tiền" } as Record<string, string>)[status ?? ""] || "chưa cập nhật";
}

function validMessage(value: unknown): value is ChatMessage {
  if (!value || typeof value !== "object") return false;
  const message = value as Partial<ChatMessage>;
  return (message.role === "user" || message.role === "bot") && typeof message.id === "string" && typeof message.text === "string" && message.text.length <= 2000;
}

function newId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function isVietnamSupportHours() {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Ho_Chi_Minh",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date());
  const hour = Number(parts.find((part) => part.type === "hour")?.value || 0);
  const minute = Number(parts.find((part) => part.type === "minute")?.value || 0);
  const totalMinutes = hour * 60 + minute;
  return totalMinutes >= 8 * 60 && totalMinutes < 22 * 60;
}
