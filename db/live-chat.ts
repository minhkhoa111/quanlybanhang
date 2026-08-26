import { env } from "cloudflare:workers";

type Bindings = { DB: D1Database };
export type LiveConversation = { id:string; customerName:string; phone:string; token:string; status:string; assignedAdmin:string; branchId:string; branchName:string; createdAt:number; updatedAt:number; lastMessage?:string; unread?:number };
export type LiveMessage = { id:string; conversationId:string; sender:string; senderName:string; text:string; createdAt:number };
const database = () => (env as unknown as Bindings).DB;
let storeReady: Promise<void> | null = null;

export async function ensureLiveChatStore() {
  if (storeReady) return storeReady;
  storeReady = initializeLiveChatStore().catch((error) => { storeReady = null; throw error; });
  return storeReady;
}

async function initializeLiveChatStore() {
  const db = database();
  if (!db) throw new Error("Cơ sở dữ liệu chưa sẵn sàng.");
  await db.batch([
    db.prepare(`CREATE TABLE IF NOT EXISTS live_chat_conversations (id TEXT PRIMARY KEY, customer_name TEXT NOT NULL, phone TEXT NOT NULL, token TEXT NOT NULL UNIQUE, status TEXT NOT NULL DEFAULT 'waiting', assigned_admin TEXT NOT NULL DEFAULT '', branch_id TEXT NOT NULL DEFAULT '', branch_name TEXT NOT NULL DEFAULT '', created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL)`),
    db.prepare(`CREATE TABLE IF NOT EXISTS live_chat_messages (id TEXT PRIMARY KEY, conversation_id TEXT NOT NULL, sender TEXT NOT NULL, sender_name TEXT NOT NULL DEFAULT '', text TEXT NOT NULL, created_at INTEGER NOT NULL)`),
    db.prepare("CREATE INDEX IF NOT EXISTS live_chat_messages_conversation_idx ON live_chat_messages(conversation_id, created_at)"),
  ]);
  await ensureColumn(db,"branch_id","TEXT NOT NULL DEFAULT ''");
  await ensureColumn(db,"branch_name","TEXT NOT NULL DEFAULT ''");
  await db.prepare("CREATE INDEX IF NOT EXISTS live_chat_conversations_branch_idx ON live_chat_conversations(branch_id, status, updated_at)").run();
}

const mapConversation = (row:Record<string,unknown>):LiveConversation => ({ id:String(row.id),customerName:String(row.customer_name),phone:String(row.phone),token:String(row.token||""),status:String(row.status),assignedAdmin:String(row.assigned_admin||""),branchId:String(row.branch_id||""),branchName:String(row.branch_name||""),createdAt:Number(row.created_at),updatedAt:Number(row.updated_at),lastMessage:String(row.last_message||""),unread:Number(row.unread||0) });
const mapMessage = (row:Record<string,unknown>):LiveMessage => ({ id:String(row.id),conversationId:String(row.conversation_id),sender:String(row.sender),senderName:String(row.sender_name||""),text:String(row.text),createdAt:Number(row.created_at) });

export async function createLiveConversation(name:string, phone:string, branch:{id:string;name:string}) {
  await ensureLiveChatStore(); const id=crypto.randomUUID(), token=crypto.randomUUID(), now=Date.now();
  await database().prepare("INSERT INTO live_chat_conversations (id,customer_name,phone,token,status,branch_id,branch_name,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?)").bind(id,name,phone,token,"waiting",branch.id,branch.name,now,now).run();
  return { id, token };
}
export async function customerConversation(id:string,token:string) { await ensureLiveChatStore(); const row=await database().prepare("SELECT * FROM live_chat_conversations WHERE id=? AND token=?").bind(id,token).first<Record<string,unknown>>(); return row?mapConversation(row):undefined; }
export async function addLiveMessage(conversationId:string,sender:string,senderName:string,text:string) { await ensureLiveChatStore(); const now=Date.now(); await database().batch([database().prepare("INSERT INTO live_chat_messages (id,conversation_id,sender,sender_name,text,created_at) VALUES (?,?,?,?,?,?)").bind(crypto.randomUUID(),conversationId,sender,senderName,text,now),database().prepare("UPDATE live_chat_conversations SET updated_at=?, status=CASE WHEN status='closed' THEN 'active' ELSE status END WHERE id=?").bind(now,conversationId)]); }
export async function getLiveMessages(id:string,after=0) { await ensureLiveChatStore(); const rows=await database().prepare("SELECT * FROM live_chat_messages WHERE conversation_id=? AND created_at>? ORDER BY created_at ASC LIMIT 200").bind(id,after).all<Record<string,unknown>>(); return rows.results.map(mapMessage); }
export async function getAdminConversations(branchId="") { await ensureLiveChatStore(); const sql=`SELECT c.*, (SELECT text FROM live_chat_messages WHERE conversation_id=c.id ORDER BY created_at DESC LIMIT 1) last_message FROM live_chat_conversations c ${branchId?"WHERE c.branch_id=?":""} ORDER BY CASE c.status WHEN 'waiting' THEN 0 WHEN 'active' THEN 1 ELSE 2 END, updated_at DESC LIMIT 100`;const statement=database().prepare(sql);const rows=branchId?await statement.bind(branchId).all<Record<string,unknown>>():await statement.all<Record<string,unknown>>();return rows.results.map((row)=>{const item=mapConversation(row);return {id:item.id,customerName:item.customerName,phone:item.phone,status:item.status,assignedAdmin:item.assignedAdmin,branchId:item.branchId,branchName:item.branchName,createdAt:item.createdAt,updatedAt:item.updatedAt,lastMessage:item.lastMessage};}); }
export async function getAdminConversation(id:string,branchId="") { await ensureLiveChatStore(); const row=branchId?await database().prepare("SELECT * FROM live_chat_conversations WHERE id=? AND branch_id=?").bind(id,branchId).first<Record<string,unknown>>():await database().prepare("SELECT * FROM live_chat_conversations WHERE id=?").bind(id).first<Record<string,unknown>>(); return row?mapConversation(row):undefined; }
export async function updateLiveConversation(id:string,status:string,admin:string) { await ensureLiveChatStore(); await database().prepare("UPDATE live_chat_conversations SET status=?,assigned_admin=?,updated_at=? WHERE id=?").bind(status,admin,Date.now(),id).run(); }
async function ensureColumn(db:D1Database,column:string,definition:string){const info=await db.prepare("PRAGMA table_info(live_chat_conversations)").all<{name:string}>();if(!info.results.some(item=>item.name===column))await db.prepare(`ALTER TABLE live_chat_conversations ADD COLUMN ${column} ${definition}`).run()}
