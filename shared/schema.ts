import { pgTable, text, serial, integer, boolean, jsonb, numeric, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// 사용자 역할 정의
export const UserRole = {
  ADMIN: "admin",
  MANAGER: "manager", 
  STAFF: "staff"
} as const;

export type UserRoleType = typeof UserRole[keyof typeof UserRole];

// 사용자 승인 상태 정의
export const ApprovalStatus = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected"
} as const;

export type ApprovalStatusType = typeof ApprovalStatus[keyof typeof ApprovalStatus];

// Users table 확장
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  fullName: text("full_name").notNull(),
  phone: text("phone"),
  role: text("role").notNull().default(UserRole.STAFF),
  approvalStatus: text("approval_status").notNull().default(ApprovalStatus.PENDING),
  resetToken: text("reset_token"),
  resetTokenExpiry: timestamp("reset_token_expiry"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  lastLogin: timestamp("last_login"),
});

// 확장된 사용자 스키마
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  fullName: true,
  phone: true,
  role: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Categories table
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
});

export const insertCategorySchema = createInsertSchema(categories).pick({
  name: true,
});

export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Category = typeof categories.$inferSelect;

// Products table - 확장된 상품 정보 포함
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  price: numeric("price").notNull(),
  imageUrl: text("image_url").notNull(),
  categoryId: integer("category_id").notNull(),
  inventory: integer("inventory").notNull().default(0),
  minStockLevel: integer("min_stock_level").default(10), // 최소 재고 수준
  sku: text("sku"), // 재고 관리 코드
  barcode: text("barcode"), // 바코드
  cost: numeric("cost"), // 원가
  weight: numeric("weight"), // 무게
  dimensions: text("dimensions"), // 규격
  isActive: boolean("is_active").notNull().default(true), // 판매 중 여부
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at"),
});

export const insertProductSchema = createInsertSchema(products).pick({
  name: true,
  description: true,
  price: true,
  imageUrl: true,
  categoryId: true,
  inventory: true,
  minStockLevel: true,
  sku: true,
  barcode: true,
  cost: true,
  weight: true,
  dimensions: true,
  isActive: true,
});

export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof products.$inferSelect;

// 재고 이력 테이블 - 재고 변동 사항 추적
export const inventoryLogs = pgTable("inventory_logs", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull(),
  previousQuantity: integer("previous_quantity").notNull(),
  newQuantity: integer("new_quantity").notNull(),
  changeReason: text("change_reason").notNull(), // 판매, 입고, 반품, 폐기 등
  userId: integer("user_id").notNull(), // 작업 수행한 사용자
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  notes: text("notes"),
});

export const insertInventoryLogSchema = createInsertSchema(inventoryLogs).pick({
  productId: true,
  previousQuantity: true,
  newQuantity: true,
  changeReason: true,
  userId: true,
  notes: true,
});

export type InsertInventoryLog = z.infer<typeof insertInventoryLogSchema>;
export type InventoryLog = typeof inventoryLogs.$inferSelect;

// 발주 상태 정의
export const OrderStatus = {
  DRAFT: "draft",
  SUBMITTED: "submitted",
  PROCESSING: "processing",
  COMPLETED: "completed",
  CANCELLED: "cancelled"
} as const;

export type OrderStatusType = typeof OrderStatus[keyof typeof OrderStatus];

// 발주 테이블 - 상품 발주 관리
export const purchaseOrders = pgTable("purchase_orders", {
  id: serial("id").primaryKey(),
  orderNumber: text("order_number").notNull().unique(),
  supplierId: integer("supplier_id"),
  status: text("status").notNull().default(OrderStatus.DRAFT),
  totalAmount: numeric("total_amount").notNull().default("0"),
  notes: text("notes"),
  expectedDeliveryDate: timestamp("expected_delivery_date"),
  createdBy: integer("created_by").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at"),
});

export const insertPurchaseOrderSchema = createInsertSchema(purchaseOrders).pick({
  orderNumber: true,
  supplierId: true,
  status: true,
  totalAmount: true,
  notes: true,
  expectedDeliveryDate: true,
  createdBy: true,
});

export type InsertPurchaseOrder = z.infer<typeof insertPurchaseOrderSchema>;
export type PurchaseOrder = typeof purchaseOrders.$inferSelect;

// 발주 항목 테이블 - 발주 내 개별 품목
export const purchaseOrderItems = pgTable("purchase_order_items", {
  id: serial("id").primaryKey(),
  purchaseOrderId: integer("purchase_order_id").notNull(),
  productId: integer("product_id").notNull(),
  quantity: integer("quantity").notNull(),
  unitPrice: numeric("unit_price").notNull(),
  totalPrice: numeric("total_price").notNull(),
  receivedQuantity: integer("received_quantity").default(0),
  notes: text("notes"),
});

export const insertPurchaseOrderItemSchema = createInsertSchema(purchaseOrderItems).pick({
  purchaseOrderId: true,
  productId: true,
  quantity: true,
  unitPrice: true,
  totalPrice: true,
  receivedQuantity: true,
  notes: true,
});

export type InsertPurchaseOrderItem = z.infer<typeof insertPurchaseOrderItemSchema>;
export type PurchaseOrderItem = typeof purchaseOrderItems.$inferSelect;

// 공급업체 테이블
export const suppliers = pgTable("suppliers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  contactName: text("contact_name"),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  notes: text("notes"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertSupplierSchema = createInsertSchema(suppliers).pick({
  name: true,
  contactName: true,
  email: true,
  phone: true,
  address: true,
  notes: true,
  isActive: true,
});

export type InsertSupplier = z.infer<typeof insertSupplierSchema>;
export type Supplier = typeof suppliers.$inferSelect;

// Cart items type (not stored in database)
export const cartItemSchema = z.object({
  productId: z.number(),
  name: z.string(),
  price: z.string(),
  imageUrl: z.string(),
  quantity: z.number().int().positive(),
});

export type CartItem = z.infer<typeof cartItemSchema>;

// 거래 상태 정의
export const TransactionStatus = {
  COMPLETED: "completed",
  REFUNDED: "refunded",
  CANCELLED: "cancelled",
  PENDING: "pending"
} as const;

export type TransactionStatusType = typeof TransactionStatus[keyof typeof TransactionStatus];

// 매출 테이블 (향상된 영수증 스키마)
export const receipts = pgTable("receipts", {
  id: serial("id").primaryKey(),
  receiptNumber: text("receipt_number").notNull().unique(),
  customerId: integer("customer_id"),
  userId: integer("user_id").notNull(), // 판매자/직원 ID
  items: jsonb("items").notNull(),
  subtotal: numeric("subtotal").notNull(),
  tax: numeric("tax").notNull(),
  discount: numeric("discount").default("0"),
  total: numeric("total").notNull(),
  paymentMethod: text("payment_method").notNull(),
  status: text("status").notNull().default(TransactionStatus.COMPLETED),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at"),
});

export const insertReceiptSchema = createInsertSchema(receipts).pick({
  receiptNumber: true,
  customerId: true,
  userId: true,
  items: true,
  subtotal: true,
  tax: true,
  discount: true,
  total: true,
  paymentMethod: true,
  status: true,
  notes: true,
});

export type InsertReceipt = z.infer<typeof insertReceiptSchema>;
export type Receipt = typeof receipts.$inferSelect;

// 고객 테이블
export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  fullName: text("full_name").notNull(),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  membershipLevel: text("membership_level").default("regular"),
  points: integer("points").default(0),
  birthdate: timestamp("birthdate"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  lastVisit: timestamp("last_visit"),
});

export const insertCustomerSchema = createInsertSchema(customers).pick({
  fullName: true,
  email: true,
  phone: true,
  address: true,
  membershipLevel: true,
  points: true,
  birthdate: true,
  notes: true,
});

export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type Customer = typeof customers.$inferSelect;

// 매출 일일 통계 테이블
export const dailySalesStats = pgTable("daily_sales_stats", {
  id: serial("id").primaryKey(),
  date: text("date").notNull().unique(),
  totalSales: numeric("total_sales").notNull().default("0"),
  totalTransactions: integer("total_transactions").notNull().default(0),
  avgTransactionValue: numeric("avg_transaction_value").default("0"),
  topSellingProduct: integer("top_selling_product"),
  topSellingCategory: integer("top_selling_category"),
  totalRefunds: numeric("total_refunds").default("0"),
  totalDiscounts: numeric("total_discounts").default("0"),
});

export const insertDailySalesStatsSchema = createInsertSchema(dailySalesStats).pick({
  date: true,
  totalSales: true,
  totalTransactions: true,
  avgTransactionValue: true,
  topSellingProduct: true,
  topSellingCategory: true,
  totalRefunds: true,
  totalDiscounts: true,
});

export type InsertDailySalesStat = z.infer<typeof insertDailySalesStatsSchema>;
export type DailySalesStat = typeof dailySalesStats.$inferSelect;

// 월별 매출 통계 테이블
export const monthlySalesStats = pgTable("monthly_sales_stats", {
  id: serial("id").primaryKey(),
  month: text("month").notNull().unique(), // YYYY-MM 형식
  totalSales: numeric("total_sales").notNull().default("0"),
  totalTransactions: integer("total_transactions").notNull().default(0),
  avgTransactionValue: numeric("avg_transaction_value").default("0"),
  topSellingProducts: jsonb("top_selling_products"), // 상위 5개 제품 배열
  topSellingCategories: jsonb("top_selling_categories"), // 상위 카테고리 배열
  salesGrowth: numeric("sales_growth"), // 전월 대비 성장률
  totalRefunds: numeric("total_refunds").default("0"),
  totalDiscounts: numeric("total_discounts").default("0"),
});

export const insertMonthlySalesStatsSchema = createInsertSchema(monthlySalesStats).pick({
  month: true,
  totalSales: true,
  totalTransactions: true,
  avgTransactionValue: true,
  topSellingProducts: true,
  topSellingCategories: true,
  salesGrowth: true,
  totalRefunds: true,
  totalDiscounts: true,
});

export type InsertMonthlySalesStat = z.infer<typeof insertMonthlySalesStatsSchema>;
export type MonthlySalesStat = typeof monthlySalesStats.$inferSelect;
