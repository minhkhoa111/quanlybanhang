import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const products = sqliteTable("products", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  brand: text("brand").notNull(),
  category: text("category").notNull(),
  sku: text("sku").notNull().default(""),
  description: text("description").notNull().default(""),
  image: text("image").notNull(),
  imagesJson: text("images_json").notNull().default("[]"),
  badge: text("badge").notNull(),
  tagline: text("tagline").notNull(),
  price: text("price").notNull(),
  costPrice: text("cost_price").notNull().default(""),
  sellingPrice: text("selling_price").notNull().default(""),
  salePrice: text("sale_price").notNull().default(""),
  stock: integer("stock").notNull().default(0),
  status: text("status").notNull().default("active"),
  tagsJson: text("tags_json").notNull().default("[]"),
  seoTitle: text("seo_title").notNull().default(""),
  seoDescription: text("seo_description").notNull().default(""),
  variantsJson: text("variants_json").notNull().default("[]"),
  colorsJson: text("colors_json").notNull(),
  specsJson: text("specs_json").notNull(),
  featured: integer("featured").notNull().default(0),
  active: integer("active").notNull().default(1),
  source: text("source").notNull().default(""),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

export const productViews = sqliteTable("product_views", {
  id: text("id").primaryKey(),
  productSlug: text("product_slug").notNull(),
  visitorId: text("visitor_id").notNull(),
  viewedAt: integer("viewed_at").notNull(),
});

export const branches = sqliteTable("branches", {
  id:text("id").primaryKey(),code:text("code").notNull().unique(),name:text("name").notNull(),address:text("address").notNull(),
  phone:text("phone").notNull().default(""),hours:text("hours").notNull().default("08:00–22:00"),active:integer("active").notNull().default(1),createdAt:integer("created_at").notNull(),
});

export const branchCameras = sqliteTable("branch_cameras", {
  id: text("id").primaryKey(), branchId: text("branch_id").notNull(), name: text("name").notNull(),
  location: text("location").notNull().default(""), streamUrl: text("stream_url").notNull(),
  streamType: text("stream_type").notNull().default("embed"), active: integer("active").notNull().default(1),
  createdAt: integer("created_at").notNull(),
});

export const cameraBranchPermissions = sqliteTable("camera_branch_permissions", {
  id: text("id").primaryKey(), adminUserId: text("admin_user_id").notNull(),
  branchId: text("branch_id").notNull(), createdAt: integer("created_at").notNull(),
});

export const liveChatConversations = sqliteTable("live_chat_conversations", {
  id: text("id").primaryKey(), customerName: text("customer_name").notNull(), phone: text("phone").notNull(),
  token: text("token").notNull().unique(), status: text("status").notNull().default("waiting"),
  assignedAdmin: text("assigned_admin").notNull().default(""), createdAt: integer("created_at").notNull(), updatedAt: integer("updated_at").notNull(),
});
export const liveChatMessages = sqliteTable("live_chat_messages", {
  id: text("id").primaryKey(), conversationId: text("conversation_id").notNull(), sender: text("sender").notNull(),
  senderName: text("sender_name").notNull().default(""), text: text("text").notNull(), createdAt: integer("created_at").notNull(),
});

export const orders = sqliteTable("orders", {
  id: text("id").primaryKey(),
  orderCode: text("order_code").notNull().default(""),
  customerName: text("customer_name").notNull(),
  phone: text("phone").notNull(),
  email: text("email").notNull().default(""),
  productSlug: text("product_slug").notNull().default(""),
  productName: text("product_name").notNull(),
  color: text("color").notNull().default(""),
  storage: text("storage").notNull().default(""),
  quantity: integer("quantity").notNull().default(1),
  deliveryMethod: text("delivery_method").notNull().default(""),
  address: text("address").notNull().default(""),
  paymentMethod: text("payment_method").notNull().default(""),
  contactTime: text("contact_time").notNull().default(""),
  note: text("note").notNull().default(""),
  status: text("status").notNull().default("new"),
  paymentStatus: text("payment_status").notNull().default("unpaid"),
  total: text("total").notNull().default(""),
  shippingFee: text("shipping_fee").notNull().default(""),
  discount: text("discount").notNull().default(""),
  financeCompany: text("finance_company").notNull().default(""),
  installmentName: text("installment_name").notNull().default(""),
  installmentPhone: text("installment_phone").notNull().default(""),
  dateOfBirth: text("date_of_birth").notNull().default(""),
  citizenId: text("citizen_id").notNull().default(""),
  citizenIdIssueDate: text("citizen_id_issue_date").notNull().default(""),
  citizenIdIssuePlace: text("citizen_id_issue_place").notNull().default(""),
  downPaymentPercent: integer("down_payment_percent").notNull().default(0),
  downPaymentAmount: text("down_payment_amount").notNull().default(""),
  financedAmount: text("financed_amount").notNull().default(""),
  installmentTerm: integer("installment_term").notNull().default(0),
  monthlyPayment: text("monthly_payment").notNull().default(""),
  estimatedInterest: text("estimated_interest").notNull().default(""),
  customerId: text("customer_id").notNull().default(""),
  voucherCode: text("voucher_code").notNull().default(""),
  itemsJson: text("items_json").notNull().default("[]"),
  branchId: text("branch_id").notNull().default(""),
  branchName: text("branch_name").notNull().default(""),
  assignedAdminId: text("assigned_admin_id").notNull().default(""),
  assignedAdminName: text("assigned_admin_name").notNull().default(""),
  createdAt: integer("created_at").notNull(),
});

export const bankPaymentEvents = sqliteTable("bank_payment_events", {
  id: text("id").primaryKey(),
  orderCode: text("order_code").notNull(),
  amount: integer("amount").notNull(),
  description: text("description").notNull().default(""),
  accountNumber: text("account_number").notNull().default(""),
  createdAt: integer("created_at").notNull(),
});

export const customers = sqliteTable("customers", {
  id: text("id").primaryKey(),
  username: text("username").notNull().default(""),
  avatarUrl: text("avatar_url").notNull().default(""),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone").notNull().default(""),
  passwordHash: text("password_hash").notNull(),
  passwordSalt: text("password_salt").notNull(),
  provider: text("provider").notNull().default("password"),
  googleSub: text("google_sub").notNull().default(""),
  emailVerified: integer("email_verified").notNull().default(0),
  phoneVerified: integer("phone_verified").notNull().default(0),
  profileCompleted: integer("profile_completed").notNull().default(1),
  verificationChannel: text("verification_channel").notNull().default("email"),
  createdAt: integer("created_at").notNull(),
});

export const customerSessions = sqliteTable("customer_sessions", {
  id: text("id").primaryKey(),
  customerId: text("customer_id").notNull(),
  tokenHash: text("token_hash").notNull().unique(),
  expiresAt: integer("expires_at").notNull(),
  createdAt: integer("created_at").notNull(),
});

export const customerVerificationSessions = sqliteTable("customer_verification_sessions", {
  id: text("id").primaryKey(),
  customerId: text("customer_id").notNull(),
  tokenHash: text("token_hash").notNull().unique(),
  channel: text("channel").notNull(),
  destination: text("destination").notNull(),
  expiresAt: integer("expires_at").notNull(),
  createdAt: integer("created_at").notNull(),
});

export const vouchers = sqliteTable("vouchers", {
  id: text("id").primaryKey(),
  code: text("code").notNull().unique(),
  type: text("type").notNull(),
  value: integer("value").notNull(),
  minOrder: integer("min_order").notNull().default(0),
  maxDiscount: integer("max_discount").notNull().default(0),
  usageLimit: integer("usage_limit").notNull().default(0),
  usedCount: integer("used_count").notNull().default(0),
  startsAt: integer("starts_at").notNull().default(0),
  expiresAt: integer("expires_at").notNull().default(0),
  active: integer("active").notNull().default(1),
  createdAt: integer("created_at").notNull(),
});
