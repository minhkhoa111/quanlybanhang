import { env } from "cloudflare:workers";
import { recordBankPayment } from "@/db/orders";

type Bindings = {
  CASSO_WEBHOOK_SECRET?: string;
};

type CassoTransaction = {
  id?: string | number;
  reference?: string;
  tid?: string;
  amount?: number;
  description?: string;
  accountNumber?: string;
  subAccId?: string;
};

const BANK_ACCOUNT = "6820102010";

export async function POST(request: Request) {
  const bindingSecret = (env as unknown as Bindings).CASSO_WEBHOOK_SECRET;
  const secret = (bindingSecret || process.env.CASSO_WEBHOOK_SECRET || "").trim();
  if (!secret) {
    return Response.json({ message: "Webhook chưa được cấu hình." }, { status: 503 });
  }
  const suppliedToken = request.headers.get("secure-token") ?? "";
  if (!constantTimeEqual(suppliedToken, secret)) {
    return Response.json({ message: "Webhook không hợp lệ." }, { status: 401 });
  }

  const payload = await request.json().catch(() => null) as
    | { error?: number | string; data?: CassoTransaction | CassoTransaction[] }
    | null;
  if (!payload || !payload.data || ![0, "0"].includes(payload.error ?? 0)) {
    return Response.json({ message: "Dữ liệu webhook không hợp lệ." }, { status: 400 });
  }

  const transactions = Array.isArray(payload.data) ? payload.data : [payload.data];
  let processed = 0;
  for (const transaction of transactions) {
    const amount = Number(transaction.amount) || 0;
    const description = String(transaction.description ?? "").toUpperCase();
    const accountNumber = String(transaction.accountNumber ?? transaction.subAccId ?? "");
    const orderCode = description.match(/HA[A-Z0-9]{10}/)?.[0] ?? "";
    const transactionId = String(transaction.reference ?? transaction.tid ?? transaction.id ?? "");
    if (!transactionId || !orderCode || amount <= 0) continue;
    if (accountNumber && accountNumber !== BANK_ACCOUNT) continue;

    await recordBankPayment({
      id: `casso-${transactionId}`,
      orderCode,
      amount,
      description,
      accountNumber: accountNumber || BANK_ACCOUNT,
    });
    processed += 1;
  }

  return Response.json({ error: 0, message: "success", processed });
}

function constantTimeEqual(left: string, right: string) {
  if (left.length !== right.length) return false;
  let mismatch = 0;
  for (let index = 0; index < left.length; index += 1) {
    mismatch |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return mismatch === 0;
}
