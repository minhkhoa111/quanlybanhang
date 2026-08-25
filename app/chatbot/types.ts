import type { ChatIntent } from "@/app/data/chatbotKnowledge";

export type ChatProduct = {
  slug: string;
  name: string;
  brand: string;
  price: string;
  tagline: string;
  stock?: number;
  active?: boolean;
};

export type ChatContext = {
  productSlug?: string;
  productName?: string;
  orderCode?: string;
  lastIntent?: ChatIntent;
};

export type BotReply = {
  intent: ChatIntent;
  confidence: number;
  text: string;
  context: ChatContext;
  link?: { href: string; label: string };
  showQuickReplies?: boolean;
  orderCode?: string;
};

export type ChatMessage = {
  id: string;
  role: "user" | "bot";
  text: string;
  createdAt: number;
  intent?: ChatIntent;
  confidence?: number;
  link?: { href: string; label: string };
};
