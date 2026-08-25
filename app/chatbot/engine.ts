import {
  CHATBOT_KNOWLEDGE,
  CHATBOT_SHIPPING_KNOWLEDGE,
  CHATBOT_SYNONYMS,
  CHATBOT_UNKNOWN,
  type ChatIntent,
} from "@/app/data/chatbotKnowledge";
import type { BotReply, ChatContext, ChatProduct } from "./types";

const CONFIDENCE_THRESHOLD = 0.43;
const PRODUCT_THRESHOLD = 0.58;
const ORDER_CODE_PATTERN = /\bHA[A-Z0-9]{10}\b/i;
const STOP_WORDS = new Set(["cho", "toi", "mình", "minh", "cua", "với", "voi", "là", "la", "co", "khong", "ơi", "oi"]);

export function normalizeChatText(value: string) {
  let normalized = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  for (const [source, target] of Object.entries(CHATBOT_SYNONYMS)) {
    const plainSource = normalizeWithoutSynonyms(source);
    if (normalized === plainSource || normalized.includes(` ${plainSource} `) || normalized.startsWith(`${plainSource} `) || normalized.endsWith(` ${plainSource}`)) {
      normalized = normalized.replace(new RegExp(`\\b${escapeRegExp(plainSource)}\\b`, "g"), normalizeWithoutSynonyms(target));
    }
  }
  return normalized;
}

export function createBotReply(message: string, products: ChatProduct[], context: ChatContext = {}): BotReply {
  const cleanMessage = message.trim().slice(0, 300);
  const normalized = normalizeChatText(cleanMessage);
  const orderCode = cleanMessage.match(ORDER_CODE_PATTERN)?.[0]?.toUpperCase();
  const intentResult = detectIntent(normalized);
  const productResult = findProduct(normalized, products);
  const contextProduct = context.productSlug ? products.find((product) => product.slug === context.productSlug) : undefined;

  const shippingFollowUp = context.lastIntent === "shipping" && isShippingFollowUp(normalized);
  if (intentResult.intent === "shipping" || shippingFollowUp) {
    return {
      intent: "shipping",
      confidence: shippingFollowUp ? Math.max(intentResult.confidence, 0.82) : intentResult.confidence,
      text: findShippingResponse(normalized),
      context: { ...context, lastIntent: "shipping" },
    };
  }

  if (orderCode && (intentResult.intent === "order_status" || normalized === normalizeChatText(orderCode))) {
    return {
      intent: "order_status",
      confidence: 1,
      text: `Mình đang kiểm tra mã đơn ${orderCode} trên hệ thống nội bộ.`,
      context: { ...context, orderCode, lastIntent: "order_status" },
      orderCode,
    };
  }

  if (productResult && shouldUseProductResult(intentResult.intent, normalized, productResult.confidence)) {
    const product = productResult.product;
    const stockText = typeof product.stock === "number" && product.stock > 0
      ? ` Tồn kho hệ thống: ${product.stock} sản phẩm.`
      : " Tồn kho sẽ được cửa hàng xác nhận trước khi giao.";
    return {
      intent: intentResult.intent === "product_price" ? "product_price" : "product_search",
      confidence: Math.max(intentResult.confidence, productResult.confidence),
      text: `${product.name}: ${product.price}. ${product.tagline}${stockText}`,
      context: { ...context, productSlug: product.slug, productName: product.name, lastIntent: intentResult.intent === "product_price" ? "product_price" : "product_search" },
      link: { href: `/san-pham/${product.slug}`, label: "Xem sản phẩm" },
    };
  }

  if (intentResult.intent === "product_price" && contextProduct) {
    return {
      intent: "product_price",
      confidence: intentResult.confidence,
      text: `${contextProduct.name} hiện có giá ${contextProduct.price}. Giá có thể thay đổi theo dung lượng, RAM hoặc màu bạn chọn.`,
      context: { ...context, lastIntent: "product_price" },
      link: { href: `/san-pham/${contextProduct.slug}`, label: "Xem cấu hình và giá" },
    };
  }

  if (intentResult.intent === "warranty" && contextProduct) {
    return {
      intent: "warranty",
      confidence: intentResult.confidence,
      text: `Với ${contextProduct.name}, thời hạn và điều kiện bảo hành cần được xác nhận theo phiên bản, tình trạng máy và nhà cung cấp. Cửa hàng sẽ ghi rõ thông tin này trước khi giao máy.`,
      context: { ...context, lastIntent: "warranty" },
      link: { href: `/san-pham/${contextProduct.slug}`, label: "Xem lại sản phẩm" },
    };
  }

  if (intentResult.confidence < CONFIDENCE_THRESHOLD || intentResult.intent === "unknown") {
    return { intent: "unknown", confidence: intentResult.confidence, text: CHATBOT_UNKNOWN, context: { ...context, lastIntent: "unknown" }, showQuickReplies: true };
  }

  return {
    intent: intentResult.intent,
    confidence: intentResult.confidence,
    text: CHATBOT_KNOWLEDGE[intentResult.intent].response,
    context: { ...context, lastIntent: intentResult.intent },
    showQuickReplies: intentResult.intent === "products",
  };
}

function findShippingResponse(normalized: string) {
  let bestResponse = CHATBOT_KNOWLEDGE.shipping.response;
  let bestScore = 0;

  for (const rule of CHATBOT_SHIPPING_KNOWLEDGE) {
    const phrases = rule.phrases.map(normalizeChatText);
    const keywords = rule.keywords.map(normalizeChatText);
    const exactPhrase = phrases.some((phrase) => normalized.includes(phrase)) ? 1 : 0;
    const phraseScore = Math.max(0, ...phrases.map((phrase) => textSimilarity(normalized, phrase) * 0.86));
    const keywordMatches = keywords.filter((keyword) => normalized.includes(keyword)).length;
    const keywordScore = keywordMatches ? Math.min(0.96, 0.58 + keywordMatches * 0.16) : 0;
    const score = Math.max(exactPhrase, phraseScore, keywordScore);
    if (score > bestScore) {
      bestScore = score;
      bestResponse = rule.response;
    }
  }

  return bestResponse;
}

function isShippingFollowUp(normalized: string) {
  return [
    "bao lau", "bao ngay", "may ngay", "khi nao", "phi bao nhieu", "mat phi", "hoa toc",
    "don vi nao", "hang nao", "viettel", "j t", "spx", "tinh", "hinh thuc nao", "cach nao",
  ].some((phrase) => normalized.includes(phrase));
}

function detectIntent(normalized: string): { intent: ChatIntent; confidence: number } {
  if (!normalized) return { intent: "unknown", confidence: 0 };
  let best: { intent: ChatIntent; confidence: number } = { intent: "unknown", confidence: 0 };

  for (const [intent, knowledge] of Object.entries(CHATBOT_KNOWLEDGE) as Array<[ChatIntent, (typeof CHATBOT_KNOWLEDGE)[ChatIntent]]>) {
    if (intent === "unknown") continue;
    const phraseScore = Math.max(0, ...knowledge.phrases.map((phrase) => textSimilarity(normalized, normalizeChatText(phrase))));
    const normalizedKeywords = knowledge.keywords.map(normalizeChatText);
    const matchedKeywords = normalizedKeywords.filter((keyword) => normalized.includes(keyword));
    const keywordScore = matchedKeywords.length ? Math.min(1, 0.46 + matchedKeywords.length * 0.2) : 0;
    const exactPhrase = knowledge.phrases.some((phrase) => normalized.includes(normalizeChatText(phrase))) ? 0.94 : 0;
    const confidence = Math.max(phraseScore * 0.82, keywordScore, exactPhrase);
    if (confidence > best.confidence) best = { intent, confidence };
  }
  return best;
}

function findProduct(query: string, products: ChatProduct[]) {
  const queryTokens = usefulTokens(query);
  let best: { product: ChatProduct; confidence: number } | undefined;
  for (const product of products) {
    if (product.active === false) continue;
    const name = normalizeChatText(product.name);
    const nameTokens = usefulTokens(name);
    const direct = query.includes(name) || name.includes(query) ? 0.98 : 0;
    const overlap = tokenOverlap(queryTokens, nameTokens);
    const compactQuery = queryTokens.join(" ");
    const compactName = nameTokens.join(" ");
    const fuzzy = compactQuery.length >= 4 ? textSimilarity(compactQuery, compactName) : 0;
    const confidence = Math.max(direct, overlap * 0.9, fuzzy * 0.78);
    if (!best || confidence > best.confidence) best = { product, confidence };
  }
  return best && best.confidence >= PRODUCT_THRESHOLD ? best : undefined;
}

function shouldUseProductResult(intent: ChatIntent, query: string, confidence: number) {
  if (confidence < PRODUCT_THRESHOLD) return false;
  if (["warranty", "shipping", "payment", "store_information", "contact", "promotion", "order_status", "thanks", "goodbye"].includes(intent)) return false;
  return intent === "product_price" || intent === "product_search" || intent === "products" || query.split(" ").length <= 7;
}

function textSimilarity(left: string, right: string) {
  if (!left || !right) return 0;
  if (left === right) return 1;
  if (left.includes(right) || right.includes(left)) return Math.min(0.92, Math.min(left.length, right.length) / Math.max(left.length, right.length) + 0.35);
  const distance = levenshtein(left, right);
  return Math.max(0, 1 - distance / Math.max(left.length, right.length));
}

function tokenOverlap(left: string[], right: string[]) {
  if (!left.length || !right.length) return 0;
  const rightSet = new Set(right);
  const matches = left.filter((token) => rightSet.has(token)).length;
  return matches / Math.max(1, Math.min(left.length, right.length));
}

function usefulTokens(value: string) {
  return value.split(" ").filter((token) => token.length > 1 && !STOP_WORDS.has(token));
}

function levenshtein(left: string, right: string) {
  const row = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let i = 1; i <= left.length; i += 1) {
    let previous = row[0];
    row[0] = i;
    for (let j = 1; j <= right.length; j += 1) {
      const current = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, previous + (left[i - 1] === right[j - 1] ? 0 : 1));
      previous = current;
    }
  }
  return row[right.length];
}

function normalizeWithoutSynonyms(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
