// server/index.ts
import express2 from "express";

// server/routes.ts
import { createServer } from "http";

// shared/schema.ts
import { pgTable, text, serial, integer, boolean, jsonb, numeric, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
var UserRole = {
  ADMIN: "admin",
  MANAGER: "manager",
  STAFF: "staff"
};
var ApprovalStatus = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected"
};
var users = pgTable("users", {
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
  lastLogin: timestamp("last_login")
});
var insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  fullName: true,
  phone: true,
  role: true
});
var categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull()
});
var insertCategorySchema = createInsertSchema(categories).pick({
  name: true
});
var products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  price: numeric("price").notNull(),
  imageUrl: text("image_url").notNull(),
  categoryId: integer("category_id").notNull(),
  inventory: integer("inventory").notNull().default(0),
  minStockLevel: integer("min_stock_level").default(10),
  // 최소 재고 수준
  sku: text("sku"),
  // 재고 관리 코드
  barcode: text("barcode"),
  // 바코드
  cost: numeric("cost"),
  // 원가
  weight: numeric("weight"),
  // 무게
  dimensions: text("dimensions"),
  // 규격
  isActive: boolean("is_active").notNull().default(true),
  // 판매 중 여부
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
});
var insertProductSchema = createInsertSchema(products).pick({
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
  isActive: true
});
var inventoryLogs = pgTable("inventory_logs", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull(),
  previousQuantity: integer("previous_quantity").notNull(),
  newQuantity: integer("new_quantity").notNull(),
  changeReason: text("change_reason").notNull(),
  // 판매, 입고, 반품, 폐기 등
  userId: integer("user_id").notNull(),
  // 작업 수행한 사용자
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  notes: text("notes")
});
var insertInventoryLogSchema = createInsertSchema(inventoryLogs).pick({
  productId: true,
  previousQuantity: true,
  newQuantity: true,
  changeReason: true,
  userId: true,
  notes: true
});
var OrderStatus2 = {
  DRAFT: "draft",
  SUBMITTED: "submitted",
  PROCESSING: "processing",
  COMPLETED: "completed",
  CANCELLED: "cancelled"
};
var purchaseOrders = pgTable("purchase_orders", {
  id: serial("id").primaryKey(),
  orderNumber: text("order_number").notNull().unique(),
  supplierId: integer("supplier_id"),
  status: text("status").notNull().default(OrderStatus2.DRAFT),
  totalAmount: numeric("total_amount").notNull().default("0"),
  notes: text("notes"),
  expectedDeliveryDate: timestamp("expected_delivery_date"),
  createdBy: integer("created_by").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
});
var insertPurchaseOrderSchema = createInsertSchema(purchaseOrders).pick({
  orderNumber: true,
  supplierId: true,
  status: true,
  totalAmount: true,
  notes: true,
  expectedDeliveryDate: true,
  createdBy: true
});
var purchaseOrderItems = pgTable("purchase_order_items", {
  id: serial("id").primaryKey(),
  purchaseOrderId: integer("purchase_order_id").notNull(),
  productId: integer("product_id").notNull(),
  quantity: integer("quantity").notNull(),
  unitPrice: numeric("unit_price").notNull(),
  totalPrice: numeric("total_price").notNull(),
  receivedQuantity: integer("received_quantity").default(0),
  notes: text("notes")
});
var insertPurchaseOrderItemSchema = createInsertSchema(purchaseOrderItems).pick({
  purchaseOrderId: true,
  productId: true,
  quantity: true,
  unitPrice: true,
  totalPrice: true,
  receivedQuantity: true,
  notes: true
});
var suppliers = pgTable("suppliers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  contactName: text("contact_name"),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  notes: text("notes"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow()
});
var insertSupplierSchema = createInsertSchema(suppliers).pick({
  name: true,
  contactName: true,
  email: true,
  phone: true,
  address: true,
  notes: true,
  isActive: true
});
var cartItemSchema = z.object({
  productId: z.number(),
  name: z.string(),
  price: z.string(),
  imageUrl: z.string(),
  quantity: z.number().int().positive()
});
var TransactionStatus2 = {
  COMPLETED: "completed",
  REFUNDED: "refunded",
  CANCELLED: "cancelled",
  PENDING: "pending"
};
var receipts = pgTable("receipts", {
  id: serial("id").primaryKey(),
  receiptNumber: text("receipt_number").notNull().unique(),
  customerId: integer("customer_id"),
  userId: integer("user_id").notNull(),
  // 판매자/직원 ID
  items: jsonb("items").notNull(),
  subtotal: numeric("subtotal").notNull(),
  tax: numeric("tax").notNull(),
  discount: numeric("discount").default("0"),
  total: numeric("total").notNull(),
  paymentMethod: text("payment_method").notNull(),
  status: text("status").notNull().default(TransactionStatus2.COMPLETED),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
});
var insertReceiptSchema = createInsertSchema(receipts).pick({
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
  notes: true
});
var customers = pgTable("customers", {
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
  lastVisit: timestamp("last_visit")
});
var insertCustomerSchema = createInsertSchema(customers).pick({
  fullName: true,
  email: true,
  phone: true,
  address: true,
  membershipLevel: true,
  points: true,
  birthdate: true,
  notes: true
});
var dailySalesStats = pgTable("daily_sales_stats", {
  id: serial("id").primaryKey(),
  date: text("date").notNull().unique(),
  totalSales: numeric("total_sales").notNull().default("0"),
  totalTransactions: integer("total_transactions").notNull().default(0),
  avgTransactionValue: numeric("avg_transaction_value").default("0"),
  topSellingProduct: integer("top_selling_product"),
  topSellingCategory: integer("top_selling_category"),
  totalRefunds: numeric("total_refunds").default("0"),
  totalDiscounts: numeric("total_discounts").default("0")
});
var insertDailySalesStatsSchema = createInsertSchema(dailySalesStats).pick({
  date: true,
  totalSales: true,
  totalTransactions: true,
  avgTransactionValue: true,
  topSellingProduct: true,
  topSellingCategory: true,
  totalRefunds: true,
  totalDiscounts: true
});
var monthlySalesStats = pgTable("monthly_sales_stats", {
  id: serial("id").primaryKey(),
  month: text("month").notNull().unique(),
  // YYYY-MM 형식
  totalSales: numeric("total_sales").notNull().default("0"),
  totalTransactions: integer("total_transactions").notNull().default(0),
  avgTransactionValue: numeric("avg_transaction_value").default("0"),
  topSellingProducts: jsonb("top_selling_products"),
  // 상위 5개 제품 배열
  topSellingCategories: jsonb("top_selling_categories"),
  // 상위 카테고리 배열
  salesGrowth: numeric("sales_growth"),
  // 전월 대비 성장률
  totalRefunds: numeric("total_refunds").default("0"),
  totalDiscounts: numeric("total_discounts").default("0")
});
var insertMonthlySalesStatsSchema = createInsertSchema(monthlySalesStats).pick({
  month: true,
  totalSales: true,
  totalTransactions: true,
  avgTransactionValue: true,
  topSellingProducts: true,
  topSellingCategories: true,
  salesGrowth: true,
  totalRefunds: true,
  totalDiscounts: true
});

// server/storage.ts
var MemStorage = class {
  users;
  categories;
  products;
  receipts;
  customers;
  suppliers;
  purchaseOrders;
  purchaseOrderItems;
  inventoryLogs;
  dailySalesStats;
  monthlySalesStats;
  userIdCounter;
  categoryIdCounter;
  productIdCounter;
  receiptIdCounter;
  customerIdCounter;
  supplierIdCounter;
  purchaseOrderIdCounter;
  purchaseOrderItemIdCounter;
  inventoryLogIdCounter;
  dailySalesStatsIdCounter;
  monthlySalesStatsIdCounter;
  constructor() {
    this.users = /* @__PURE__ */ new Map();
    this.categories = /* @__PURE__ */ new Map();
    this.products = /* @__PURE__ */ new Map();
    this.receipts = /* @__PURE__ */ new Map();
    this.customers = /* @__PURE__ */ new Map();
    this.suppliers = /* @__PURE__ */ new Map();
    this.purchaseOrders = /* @__PURE__ */ new Map();
    this.purchaseOrderItems = /* @__PURE__ */ new Map();
    this.inventoryLogs = /* @__PURE__ */ new Map();
    this.dailySalesStats = /* @__PURE__ */ new Map();
    this.monthlySalesStats = /* @__PURE__ */ new Map();
    this.userIdCounter = 1;
    this.categoryIdCounter = 1;
    this.productIdCounter = 1;
    this.receiptIdCounter = 1;
    this.customerIdCounter = 1;
    this.supplierIdCounter = 1;
    this.purchaseOrderIdCounter = 1;
    this.purchaseOrderItemIdCounter = 1;
    this.inventoryLogIdCounter = 1;
    this.dailySalesStatsIdCounter = 1;
    this.monthlySalesStatsIdCounter = 1;
    this.initializeSampleData();
  }
  initializeSampleData() {
    this.createUser({
      username: "admin",
      password: "admin123",
      email: "admin@fitpos.com",
      fullName: "\uAD00\uB9AC\uC790",
      role: UserRole.ADMIN,
      phone: "010-1234-5678"
    });
    this.createUser({
      username: "staff",
      password: "staff123",
      email: "staff@fitpos.com",
      fullName: "\uC9C1\uC6D0",
      role: UserRole.STAFF,
      phone: "010-2345-6789"
    });
    const pendingUser = this.createUser({
      username: "newstaff",
      password: "newstaff123",
      email: "newstaff@fitpos.com",
      fullName: "\uC2E0\uADDC\uC9C1\uC6D0",
      role: UserRole.STAFF,
      phone: "010-3456-7890"
    });
    this.createCustomer({
      fullName: "\uAE40\uACE0\uAC1D",
      email: "customer1@example.com",
      phone: "010-1111-2222",
      membershipLevel: "gold",
      points: 150
    });
    this.createCustomer({
      fullName: "\uC774\uD68C\uC6D0",
      email: "customer2@example.com",
      phone: "010-2222-3333",
      membershipLevel: "silver",
      points: 75
    });
    this.createSupplier({
      name: "\uD53C\uD2B8\uB2C8\uC2A4 \uC6A9\uD488 \uB3C4\uB9E4",
      contactName: "\uBC15\uACF5\uAE09",
      email: "supplier1@example.com",
      phone: "02-123-4567",
      address: "\uC11C\uC6B8\uC2DC \uAC15\uB0A8\uAD6C \uC5ED\uC0BC\uB3D9 123-45"
    });
    this.createSupplier({
      name: "\uAC74\uAC15\uC2DD\uD488 \uACF5\uAE09\uC0AC",
      contactName: "\uCD5C\uBCA4\uB354",
      email: "supplier2@example.com",
      phone: "02-234-5678",
      address: "\uC11C\uC6B8\uC2DC \uB9C8\uD3EC\uAD6C \uB9DD\uC6D0\uB3D9 234-56"
    });
    const categoriesData = [
      { name: "\uC6B4\uB3D9 \uC7A5\uBE44" },
      { name: "\uB2E8\uBC31\uC9C8 \uBCF4\uCDA9\uC81C" },
      { name: "\uC6B4\uB3D9\uBCF5" },
      { name: "\uC561\uC138\uC11C\uB9AC" },
      { name: "\uC601\uC591\uC81C" },
      { name: "\uD53C\uD2B8\uB2C8\uC2A4 \uAE30\uAE30" }
    ];
    categoriesData.forEach((cat) => this.createCategory(cat));
    const now = /* @__PURE__ */ new Date();
    const productsData = [
      {
        name: "\uD504\uB9AC\uBBF8\uC5C4 \uB364\uBCA8 \uC138\uD2B8",
        description: "\uACE0\uAE09 \uC2A4\uD14C\uC778\uB9AC\uC2A4 \uC2A4\uD2F8 \uB364\uBCA8 \uC138\uD2B8 (2kg-10kg)",
        price: "89.99",
        imageUrl: "https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2",
        categoryId: 1,
        inventory: 30,
        minStockLevel: 5,
        sku: "DUMB-001",
        barcode: "8801234567890",
        cost: "45.00",
        isActive: true
      },
      {
        name: "\uD53C\uD2B8\uB2C8\uC2A4 \uD2B8\uB798\uCEE4",
        description: "\uC2EC\uBC15\uC218 \uBC0F \uD65C\uB3D9\uB7C9 \uCE21\uC815 \uC2A4\uB9C8\uD2B8 \uD53C\uD2B8\uB2C8\uC2A4 \uD2B8\uB798\uCEE4",
        price: "199.99",
        imageUrl: "https://images.unsplash.com/photo-1557438159-61a0bf0ef9a0",
        categoryId: 6,
        inventory: 25,
        minStockLevel: 5,
        sku: "TRACK-001",
        barcode: "8801234567891",
        cost: "120.00",
        isActive: true
      },
      {
        name: "\uB0A8\uC131\uC6A9 \uB7F0\uB2DD \uD2F0\uC154\uCE20",
        description: "\uD1B5\uAE30\uC131 \uC88B\uC740 \uAE30\uB2A5\uC131 \uB7F0\uB2DD \uD2F0\uC154\uCE20",
        price: "45.99",
        imageUrl: "https://images.unsplash.com/photo-1574583344583-89525e54c8ac",
        categoryId: 3,
        inventory: 50,
        minStockLevel: 10,
        sku: "SHIRT-M01",
        barcode: "8801234567892",
        cost: "22.50",
        isActive: true
      },
      {
        name: "\uC5EC\uC131\uC6A9 \uC694\uAC00 \uB808\uAE45\uC2A4",
        description: "\uC2E0\uCD95\uC131 \uC88B\uC740 \uD504\uB9AC\uBBF8\uC5C4 \uC694\uAC00 \uB808\uAE45\uC2A4",
        price: "59.99",
        imageUrl: "https://images.unsplash.com/photo-1506126613408-eca07ce68773",
        categoryId: 3,
        inventory: 40,
        minStockLevel: 8,
        sku: "LEGN-F01",
        barcode: "8801234567893",
        cost: "28.00",
        isActive: true
      },
      {
        name: "\uD504\uB85C\uD2F4 \uD30C\uC6B0\uB354 1kg",
        description: "\uACE0\uD488\uC9C8 \uB2E8\uBC31\uC9C8 \uBCF4\uCDA9\uC81C 1kg",
        price: "79.99",
        imageUrl: "https://images.unsplash.com/photo-1579722821273-0f6c1a44d548",
        categoryId: 2,
        inventory: 35,
        minStockLevel: 10,
        sku: "PROT-001",
        barcode: "8801234567894",
        cost: "42.00",
        isActive: true
      },
      {
        name: "\uD734\uB300\uC6A9 \uD3FC\uB864\uB7EC",
        description: "\uC6B4\uB3D9 \uD6C4 \uADFC\uC721 \uC774\uC644\uC744 \uC704\uD55C \uD3FC\uB864\uB7EC",
        price: "29.99",
        imageUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b",
        categoryId: 1,
        inventory: 60,
        minStockLevel: 12,
        sku: "FOAM-001",
        barcode: "8801234567895",
        cost: "15.00",
        isActive: true
      },
      {
        name: "\uC2A4\uD3EC\uCE20 \uBB3C\uBCD1",
        description: "BPA-free 800ml \uC2A4\uD3EC\uCE20 \uBB3C\uBCD1",
        price: "24.99",
        imageUrl: "https://images.unsplash.com/photo-1594223274512-ad4803739b7c",
        categoryId: 4,
        inventory: 100,
        minStockLevel: 20,
        sku: "BOTTLE-001",
        barcode: "8801234567896",
        cost: "10.00",
        isActive: true
      },
      {
        name: "\uC6B4\uB3D9\uC6A9 \uC7A5\uAC11",
        description: "\uBB34\uAC8C \uD2B8\uB808\uC774\uB2DD\uC6A9 \uC7A5\uAC11 (M \uC0AC\uC774\uC988)",
        price: "19.99",
        imageUrl: "https://images.unsplash.com/photo-1585153514941-ed2f7fabe9a9",
        categoryId: 4,
        inventory: 45,
        minStockLevel: 10,
        sku: "GLOVE-001",
        barcode: "8801234567897",
        cost: "8.50",
        isActive: true
      },
      {
        name: "\uBA40\uD2F0\uBE44\uD0C0\uBBFC (60\uC815)",
        description: "\uC885\uD569\uBE44\uD0C0\uBBFC \uC601\uC591\uC81C 60\uC815",
        price: "32.99",
        imageUrl: "https://images.unsplash.com/photo-1595391928061-4371c5a1378e",
        categoryId: 5,
        inventory: 75,
        minStockLevel: 15,
        sku: "VITM-001",
        barcode: "8801234567898",
        cost: "18.00",
        isActive: true
      },
      {
        name: "\uB2E8\uBC31\uC9C8 \uBC14 (12\uAC1C\uC785)",
        description: "\uACE0\uB2E8\uBC31 \uC800\uB2F9 \uD504\uB85C\uD2F4 \uBC14 12\uAC1C \uC138\uD2B8",
        price: "29.99",
        imageUrl: "https://images.unsplash.com/photo-1584507892098-e05ea90d3d96",
        categoryId: 2,
        inventory: 80,
        minStockLevel: 15,
        sku: "PBAR-001",
        barcode: "8801234567899",
        cost: "15.50",
        isActive: true
      }
    ];
    const products3 = [];
    for (const product of productsData) {
      const newProduct = this.createProduct(product);
      products3.push(newProduct);
    }
    products3.forEach((product) => {
      this.createInventoryLog({
        productId: product.id,
        previousQuantity: 0,
        newQuantity: product.inventory,
        changeReason: "\uCD08\uAE30 \uC785\uACE0",
        userId: 1,
        notes: "\uC2DC\uC2A4\uD15C \uCD08\uAE30\uD654 \uC785\uACE0"
      });
    });
    const order = this.createPurchaseOrder({
      orderNumber: "PO-" + (/* @__PURE__ */ new Date()).getTime().toString().substring(5),
      supplierId: 1,
      status: OrderStatus2.COMPLETED,
      totalAmount: "495.00",
      expectedDeliveryDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1e3),
      createdBy: 1,
      notes: "\uC6D4\uAC04 \uC7AC\uACE0 \uBCF4\uCDA9 \uBC1C\uC8FC"
    });
    this.addPurchaseOrderItem({
      purchaseOrderId: order.id,
      productId: 1,
      quantity: 10,
      unitPrice: "45.00",
      totalPrice: "450.00",
      receivedQuantity: 10
    });
    this.addPurchaseOrderItem({
      purchaseOrderId: order.id,
      productId: 6,
      quantity: 3,
      unitPrice: "15.00",
      totalPrice: "45.00",
      receivedQuantity: 3
    });
    const receipt1 = this.createReceipt({
      receiptNumber: "SALE-" + (/* @__PURE__ */ new Date()).getTime().toString().substring(5),
      customerId: 1,
      userId: 1,
      items: [
        {
          productId: 1,
          name: "\uD504\uB9AC\uBBF8\uC5C4 \uB364\uBCA8 \uC138\uD2B8",
          price: "89.99",
          imageUrl: "https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2",
          quantity: 1
        },
        {
          productId: 7,
          name: "\uC2A4\uD3EC\uCE20 \uBB3C\uBCD1",
          price: "24.99",
          imageUrl: "https://images.unsplash.com/photo-1594223274512-ad4803739b7c",
          quantity: 1
        }
      ],
      subtotal: "114.98",
      tax: "11.50",
      total: "126.48",
      paymentMethod: "\uC2E0\uC6A9\uCE74\uB4DC",
      status: TransactionStatus2.COMPLETED,
      notes: "\uCCAB \uAD6C\uB9E4 \uACE0\uAC1D"
    });
    const receipt2 = this.createReceipt({
      receiptNumber: "SALE-" + ((/* @__PURE__ */ new Date()).getTime() + 1).toString().substring(5),
      customerId: 2,
      userId: 2,
      items: [
        {
          productId: 5,
          name: "\uD504\uB85C\uD2F4 \uD30C\uC6B0\uB354 1kg",
          price: "79.99",
          imageUrl: "https://images.unsplash.com/photo-1579722821273-0f6c1a44d548",
          quantity: 1
        }
      ],
      subtotal: "79.99",
      tax: "8.00",
      total: "87.99",
      paymentMethod: "\uD604\uAE08",
      status: TransactionStatus2.COMPLETED,
      notes: ""
    });
    const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    const currentMonth = today.substring(0, 7);
    this.createOrUpdateDailySalesStats({
      date: today,
      totalSales: "214.47",
      totalTransactions: 2,
      avgTransactionValue: "107.24",
      topSellingProduct: 1,
      topSellingCategory: 1,
      totalRefunds: "0",
      totalDiscounts: "0"
    });
    this.createOrUpdateMonthlySalesStats({
      month: currentMonth,
      totalSales: "214.47",
      totalTransactions: 2,
      avgTransactionValue: "107.24",
      topSellingProducts: [1, 5, 7],
      topSellingCategories: [1, 2, 4],
      salesGrowth: "0",
      totalRefunds: "0",
      totalDiscounts: "0"
    });
  }
  // User methods
  async getUser(id) {
    return this.users.get(id);
  }
  async getUserByUsername(username) {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }
  async getUserByEmail(email) {
    return Array.from(this.users.values()).find(
      (user) => user.email === email
    );
  }
  async createUser(insertUser) {
    const id = this.userIdCounter++;
    const now = /* @__PURE__ */ new Date();
    const user = {
      ...insertUser,
      id,
      approvalStatus: ApprovalStatus.PENDING,
      resetToken: null,
      resetTokenExpiry: null,
      createdAt: now,
      lastLogin: null
    };
    this.users.set(id, user);
    return user;
  }
  async updateUser(id, userData) {
    const user = this.users.get(id);
    if (!user) return void 0;
    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  async updateUserApprovalStatus(id, status) {
    const user = this.users.get(id);
    if (!user) return void 0;
    const updatedUser = { ...user, approvalStatus: status };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  async updateResetToken(id, token, expiry) {
    const user = this.users.get(id);
    if (!user) return void 0;
    const updatedUser = {
      ...user,
      resetToken: token,
      resetTokenExpiry: expiry
    };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  async getPendingUsers() {
    return Array.from(this.users.values()).filter(
      (user) => user.approvalStatus === ApprovalStatus.PENDING
    );
  }
  async getAllUsers() {
    return Array.from(this.users.values());
  }
  // Customer methods
  async getAllCustomers() {
    return Array.from(this.customers.values());
  }
  async getCustomer(id) {
    return this.customers.get(id);
  }
  async createCustomer(customer) {
    const id = this.customerIdCounter++;
    const now = /* @__PURE__ */ new Date();
    const newCustomer = {
      ...customer,
      id,
      createdAt: now,
      lastVisit: null
    };
    this.customers.set(id, newCustomer);
    return newCustomer;
  }
  async updateCustomer(id, customer) {
    const existingCustomer = this.customers.get(id);
    if (!existingCustomer) return void 0;
    const updatedCustomer = { ...existingCustomer, ...customer };
    this.customers.set(id, updatedCustomer);
    return updatedCustomer;
  }
  async updateCustomerPoints(id, points) {
    const customer = this.customers.get(id);
    if (!customer) return void 0;
    const updatedCustomer = {
      ...customer,
      points: (customer.points || 0) + points
    };
    this.customers.set(id, updatedCustomer);
    return updatedCustomer;
  }
  // Category methods
  async getAllCategories() {
    return Array.from(this.categories.values());
  }
  async createCategory(insertCategory) {
    const id = this.categoryIdCounter++;
    const category = { ...insertCategory, id };
    this.categories.set(id, category);
    return category;
  }
  async updateCategory(id, category) {
    const existingCategory = this.categories.get(id);
    if (!existingCategory) return void 0;
    const updatedCategory = { ...existingCategory, ...category };
    this.categories.set(id, updatedCategory);
    return updatedCategory;
  }
  async deleteCategory(id) {
    const products3 = await this.getProductsByCategory(id);
    if (products3.length > 0) {
      return false;
    }
    return this.categories.delete(id);
  }
  // Product methods
  async getAllProducts() {
    return Array.from(this.products.values());
  }
  async getProductsByCategory(categoryId) {
    return Array.from(this.products.values()).filter(
      (product) => product.categoryId === categoryId
    );
  }
  async getProduct(id) {
    return this.products.get(id);
  }
  async createProduct(insertProduct) {
    const id = this.productIdCounter++;
    const now = /* @__PURE__ */ new Date();
    const product = {
      ...insertProduct,
      id,
      createdAt: now,
      updatedAt: null,
      description: insertProduct.description || null,
      minStockLevel: insertProduct.minStockLevel || null,
      sku: insertProduct.sku || null,
      barcode: insertProduct.barcode || null,
      cost: insertProduct.cost || null,
      weight: insertProduct.weight || null,
      dimensions: insertProduct.dimensions || null
    };
    this.products.set(id, product);
    return product;
  }
  async updateProduct(id, product) {
    const existingProduct = this.products.get(id);
    if (!existingProduct) return void 0;
    const now = /* @__PURE__ */ new Date();
    const updatedProduct = {
      ...existingProduct,
      ...product,
      updatedAt: now
    };
    this.products.set(id, updatedProduct);
    return updatedProduct;
  }
  async updateProductInventory(id, newInventory) {
    const product = this.products.get(id);
    if (!product) return void 0;
    const previousQuantity = product.inventory;
    const now = /* @__PURE__ */ new Date();
    const updatedProduct = {
      ...product,
      inventory: newInventory,
      updatedAt: now
    };
    this.products.set(id, updatedProduct);
    return updatedProduct;
  }
  async getLowStockProducts() {
    return Array.from(this.products.values()).filter(
      (product) => product.inventory <= (product.minStockLevel || 0)
    );
  }
  // Inventory log methods
  async createInventoryLog(log2) {
    const id = this.inventoryLogIdCounter++;
    const now = /* @__PURE__ */ new Date();
    const inventoryLog = {
      ...log2,
      id,
      timestamp: log2.timestamp || now
    };
    this.inventoryLogs.set(id, inventoryLog);
    return inventoryLog;
  }
  async getInventoryLogs(productId) {
    return Array.from(this.inventoryLogs.values()).filter((log2) => log2.productId === productId).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }
  async getRecentInventoryLogs(limit = 20) {
    return Array.from(this.inventoryLogs.values()).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, limit);
  }
  // Supplier methods
  async getAllSuppliers() {
    return Array.from(this.suppliers.values());
  }
  async getSupplier(id) {
    return this.suppliers.get(id);
  }
  async createSupplier(supplier) {
    const id = this.supplierIdCounter++;
    const now = /* @__PURE__ */ new Date();
    const newSupplier = {
      ...supplier,
      id,
      createdAt: now,
      isActive: supplier.isActive !== void 0 ? supplier.isActive : true
    };
    this.suppliers.set(id, newSupplier);
    return newSupplier;
  }
  async updateSupplier(id, supplier) {
    const existingSupplier = this.suppliers.get(id);
    if (!existingSupplier) return void 0;
    const updatedSupplier = { ...existingSupplier, ...supplier };
    this.suppliers.set(id, updatedSupplier);
    return updatedSupplier;
  }
  // Purchase order methods
  async getAllPurchaseOrders() {
    return Array.from(this.purchaseOrders.values());
  }
  async getPurchaseOrder(id) {
    return this.purchaseOrders.get(id);
  }
  async createPurchaseOrder(order) {
    const id = this.purchaseOrderIdCounter++;
    const now = /* @__PURE__ */ new Date();
    const newOrder = {
      ...order,
      id,
      createdAt: now,
      updatedAt: null,
      status: order.status || OrderStatus2.DRAFT
    };
    this.purchaseOrders.set(id, newOrder);
    return newOrder;
  }
  async updatePurchaseOrderStatus(id, status) {
    const order = this.purchaseOrders.get(id);
    if (!order) return void 0;
    const now = /* @__PURE__ */ new Date();
    const updatedOrder = {
      ...order,
      status,
      updatedAt: now
    };
    this.purchaseOrders.set(id, updatedOrder);
    return updatedOrder;
  }
  // Purchase order item methods
  async getPurchaseOrderItems(orderId) {
    return Array.from(this.purchaseOrderItems.values()).filter((item) => item.purchaseOrderId === orderId);
  }
  async addPurchaseOrderItem(item) {
    const id = this.purchaseOrderItemIdCounter++;
    const newItem = {
      ...item,
      id,
      receivedQuantity: item.receivedQuantity || 0
    };
    this.purchaseOrderItems.set(id, newItem);
    const order = this.purchaseOrders.get(item.purchaseOrderId);
    if (order) {
      const totalAmount = parseFloat(order.totalAmount) + parseFloat(item.totalPrice);
      this.updatePurchaseOrderStatus(order.id, order.status);
    }
    return newItem;
  }
  async updatePurchaseOrderItem(id, itemData) {
    const item = this.purchaseOrderItems.get(id);
    if (!item) return void 0;
    const updatedItem = { ...item, ...itemData };
    this.purchaseOrderItems.set(id, updatedItem);
    if (itemData.totalPrice) {
      const order = this.purchaseOrders.get(item.purchaseOrderId);
      if (order) {
        const allItems = await this.getPurchaseOrderItems(order.id);
        const totalAmount = allItems.reduce((sum, curr) => sum + parseFloat(curr.totalPrice), 0).toFixed(2);
        this.purchaseOrders.set(order.id, {
          ...order,
          totalAmount,
          updatedAt: /* @__PURE__ */ new Date()
        });
      }
    }
    return updatedItem;
  }
  async removePurchaseOrderItem(id) {
    const item = this.purchaseOrderItems.get(id);
    if (!item) return false;
    const success = this.purchaseOrderItems.delete(id);
    if (success) {
      const order = this.purchaseOrders.get(item.purchaseOrderId);
      if (order) {
        const allItems = await this.getPurchaseOrderItems(order.id);
        const totalAmount = allItems.reduce((sum, curr) => sum + parseFloat(curr.totalPrice), 0).toFixed(2);
        this.purchaseOrders.set(order.id, {
          ...order,
          totalAmount,
          updatedAt: /* @__PURE__ */ new Date()
        });
      }
    }
    return success;
  }
  // Receipt methods
  async createReceipt(insertReceipt) {
    const id = this.receiptIdCounter++;
    const now = /* @__PURE__ */ new Date();
    const receipt = {
      ...insertReceipt,
      id,
      createdAt: now,
      updatedAt: null,
      status: insertReceipt.status || TransactionStatus2.COMPLETED,
      notes: insertReceipt.notes || null,
      discount: insertReceipt.discount || "0",
      customerId: insertReceipt.customerId || null
    };
    this.receipts.set(id, receipt);
    if (insertReceipt.items && Array.isArray(insertReceipt.items)) {
      for (const item of insertReceipt.items) {
        const product = await this.getProduct(item.productId);
        if (product) {
          const newInventory = Math.max(0, product.inventory - item.quantity);
          await this.updateProductInventory(product.id, newInventory);
          await this.createInventoryLog({
            productId: product.id,
            previousQuantity: product.inventory,
            newQuantity: newInventory,
            changeReason: "\uD310\uB9E4",
            userId: insertReceipt.userId,
            notes: `\uC601\uC218\uC99D \uBC88\uD638: ${insertReceipt.receiptNumber}`
          });
        }
      }
    }
    if (insertReceipt.customerId) {
      const totalAmount = parseFloat(insertReceipt.total);
      const earnedPoints = Math.floor(totalAmount / 100);
      await this.updateCustomerPoints(insertReceipt.customerId, earnedPoints);
      const customer = await this.getCustomer(insertReceipt.customerId);
      if (customer) {
        this.customers.set(insertReceipt.customerId, {
          ...customer,
          lastVisit: now
        });
      }
    }
    const date = now.toISOString().split("T")[0];
    const dailyStats = await this.getDailySalesStats(date);
    if (dailyStats) {
      await this.updateDailySalesStats(date, {
        totalSales: (parseFloat(dailyStats.totalSales) + parseFloat(insertReceipt.total)).toFixed(2),
        totalTransactions: dailyStats.totalTransactions + 1
      });
    } else {
      await this.createOrUpdateDailySalesStats({
        date,
        totalSales: insertReceipt.total,
        totalTransactions: 1,
        avgTransactionValue: insertReceipt.total
      });
    }
    const month = date.substring(0, 7);
    const monthlyStats = await this.getMonthlySalesStats(month);
    if (monthlyStats) {
      await this.updateMonthlySalesStats(month, {
        totalSales: (parseFloat(monthlyStats.totalSales) + parseFloat(insertReceipt.total)).toFixed(2),
        totalTransactions: monthlyStats.totalTransactions + 1
      });
    } else {
      await this.createOrUpdateMonthlySalesStats({
        month,
        totalSales: insertReceipt.total,
        totalTransactions: 1,
        avgTransactionValue: insertReceipt.total
      });
    }
    return receipt;
  }
  async getReceipt(id) {
    return this.receipts.get(id);
  }
  async getAllReceipts() {
    return Array.from(this.receipts.values());
  }
  async getReceiptsByDateRange(startDate, endDate) {
    return Array.from(this.receipts.values()).filter((receipt) => {
      if (typeof receipt.createdAt === "string") {
        return receipt.createdAt >= startDate && receipt.createdAt <= endDate;
      } else {
        const date = receipt.createdAt.toISOString().split("T")[0];
        return date >= startDate && date <= endDate;
      }
    });
  }
  async getReceiptsByCustomer(customerId) {
    return Array.from(this.receipts.values()).filter(
      (receipt) => receipt.customerId === customerId
    );
  }
  async updateReceiptStatus(id, status) {
    const receipt = this.receipts.get(id);
    if (!receipt) return void 0;
    const now = /* @__PURE__ */ new Date();
    const updatedReceipt = {
      ...receipt,
      status,
      updatedAt: now
    };
    this.receipts.set(id, updatedReceipt);
    return updatedReceipt;
  }
  // Sales stats methods
  async getDailySalesStats(date) {
    return this.dailySalesStats.get(date);
  }
  async createOrUpdateDailySalesStats(stats) {
    const id = this.dailySalesStatsIdCounter++;
    const existingStats = await this.getDailySalesStats(stats.date);
    if (existingStats) {
      const updatedStats = { ...existingStats, ...stats };
      this.dailySalesStats.set(stats.date, updatedStats);
      return updatedStats;
    } else {
      const newStats = { ...stats, id };
      this.dailySalesStats.set(stats.date, newStats);
      return newStats;
    }
  }
  async updateDailySalesStats(date, update) {
    const stats = this.dailySalesStats.get(date);
    if (!stats) return void 0;
    if (update.totalSales && update.totalTransactions) {
      const avgValue = (parseFloat(update.totalSales) / update.totalTransactions).toFixed(2);
      update.avgTransactionValue = avgValue;
    }
    const updatedStats = { ...stats, ...update };
    this.dailySalesStats.set(date, updatedStats);
    return updatedStats;
  }
  async getDailySalesStatsByRange(startDate, endDate) {
    return Array.from(this.dailySalesStats.values()).filter(
      (stats) => stats.date >= startDate && stats.date <= endDate
    );
  }
  async getMonthlySalesStats(month) {
    return this.monthlySalesStats.get(month);
  }
  async createOrUpdateMonthlySalesStats(stats) {
    const id = this.monthlySalesStatsIdCounter++;
    const existingStats = await this.getMonthlySalesStats(stats.month);
    if (existingStats) {
      const updatedStats = { ...existingStats, ...stats };
      this.monthlySalesStats.set(stats.month, updatedStats);
      return updatedStats;
    } else {
      const newStats = { ...stats, id };
      this.monthlySalesStats.set(stats.month, newStats);
      return newStats;
    }
  }
  async updateMonthlySalesStats(month, update) {
    const stats = this.monthlySalesStats.get(month);
    if (!stats) return void 0;
    if (update.totalSales && update.totalTransactions) {
      const avgValue = (parseFloat(update.totalSales) / update.totalTransactions).toFixed(2);
      update.avgTransactionValue = avgValue;
    }
    const updatedStats = { ...stats, ...update };
    this.monthlySalesStats.set(month, updatedStats);
    return updatedStats;
  }
  async getMonthlySalesStatsByRange(startMonth, endMonth) {
    return Array.from(this.monthlySalesStats.values()).filter(
      (stats) => stats.month >= startMonth && stats.month <= endMonth
    );
  }
};
var storage = new MemStorage();

// server/routes.ts
import { z as z2 } from "zod";
import crypto from "crypto";
function isAuthenticated(req, res, next) {
  next();
}
function isAdmin(req, res, next) {
  next();
}
async function registerRoutes(app2) {
  app2.get("/api/users", isAdmin, async (req, res) => {
    try {
      const users3 = await storage.getAllUsers();
      const safeUsers = users3.map(({ password, resetToken, resetTokenExpiry, ...user }) => user);
      res.json(safeUsers);
    } catch (error) {
      console.error("Failed to fetch users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });
  app2.get("/api/users/pending", isAdmin, async (req, res) => {
    try {
      const users3 = await storage.getPendingUsers();
      const safeUsers = users3.map(({ password, resetToken, resetTokenExpiry, ...user }) => user);
      res.json(safeUsers);
    } catch (error) {
      console.error("Failed to fetch pending users:", error);
      res.status(500).json({ message: "Failed to fetch pending users" });
    }
  });
  app2.post("/api/users", isAdmin, async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(409).json({ message: "Username already exists" });
      }
      const existingEmail = await storage.getUserByEmail(userData.email);
      if (existingEmail) {
        return res.status(409).json({ message: "Email already exists" });
      }
      const user = await storage.createUser({
        ...userData,
        // 임시 비밀번호 생성 (실제로는 암호화 필요)
        password: userData.password || crypto.randomBytes(8).toString("hex")
      });
      await storage.updateUserApprovalStatus(user.id, ApprovalStatus.APPROVED);
      const { password, resetToken, resetTokenExpiry, ...safeUser } = user;
      res.status(201).json(safeUser);
    } catch (error) {
      console.error("Failed to create user:", error);
      res.status(400).json({ message: "Invalid user data" });
    }
  });
  app2.post("/api/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(409).json({ message: "Username already exists" });
      }
      const existingEmail = await storage.getUserByEmail(userData.email);
      if (existingEmail) {
        return res.status(409).json({ message: "Email already exists" });
      }
      const user = await storage.createUser({
        ...userData,
        role: UserRole.STAFF
        // 기본 역할: 직원
      });
      const { password, resetToken, resetTokenExpiry, ...safeUser } = user;
      res.status(201).json({
        ...safeUser,
        message: "Registration successful. Please wait for admin approval."
      });
    } catch (error) {
      console.error("Failed to register user:", error);
      res.status(400).json({ message: "Invalid registration data" });
    }
  });
  app2.patch("/api/users/:id", isAuthenticated, async (req, res) => {
    const userId = parseInt(req.params.id);
    if (isNaN(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }
    try {
      const { username, email, fullName, phone, ...rest } = req.body;
      const updateData = {};
      if (username) updateData.username = username;
      if (email) updateData.email = email;
      if (fullName) updateData.fullName = fullName;
      if (phone) updateData.phone = phone;
      const updatedUser = await storage.updateUser(userId, updateData);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      const { password, resetToken, resetTokenExpiry, ...safeUser } = updatedUser;
      res.json(safeUser);
    } catch (error) {
      console.error(`Failed to update user ${userId}:`, error);
      res.status(400).json({ message: "Invalid user data" });
    }
  });
  app2.patch("/api/users/:id/approval", isAdmin, async (req, res) => {
    const userId = parseInt(req.params.id);
    if (isNaN(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }
    const approvalSchema = z2.object({
      status: z2.enum([ApprovalStatus.APPROVED, ApprovalStatus.REJECTED, ApprovalStatus.PENDING])
    });
    try {
      const { status } = approvalSchema.parse(req.body);
      const updatedUser = await storage.updateUserApprovalStatus(userId, status);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      const { password, resetToken, resetTokenExpiry, ...safeUser } = updatedUser;
      res.json(safeUser);
    } catch (error) {
      console.error(`Failed to update user approval status ${userId}:`, error);
      res.status(400).json({ message: "Invalid approval status" });
    }
  });
  app2.post("/api/reset-password", async (req, res) => {
    const resetSchema = z2.object({
      email: z2.string().email()
    });
    try {
      const { email } = resetSchema.parse(req.body);
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.json({ message: "Password reset link sent if email exists" });
      }
      const resetToken = crypto.randomBytes(32).toString("hex");
      const resetTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1e3);
      await storage.updateResetToken(user.id, resetToken, resetTokenExpiry);
      res.json({
        message: "Password reset link sent",
        // 실제 프로덕션에서는 제거해야 함
        debug: { resetToken }
      });
    } catch (error) {
      console.error("Failed to request password reset:", error);
      res.status(400).json({ message: "Invalid email" });
    }
  });
  app2.post("/api/change-password", async (req, res) => {
    const changeSchema = z2.object({
      resetToken: z2.string(),
      newPassword: z2.string().min(6)
    });
    try {
      const { resetToken, newPassword } = changeSchema.parse(req.body);
      const users3 = await storage.getAllUsers();
      const user = users3.find((u) => u.resetToken === resetToken && u.resetTokenExpiry && new Date(u.resetTokenExpiry) > /* @__PURE__ */ new Date());
      if (!user) {
        return res.status(400).json({ message: "Invalid or expired reset token" });
      }
      await storage.updateUser(user.id, { password: newPassword });
      await storage.updateResetToken(user.id, null, null);
      res.json({ message: "Password changed successfully" });
    } catch (error) {
      console.error("Failed to change password:", error);
      res.status(400).json({ message: "Invalid request" });
    }
  });
  app2.get("/api/customers", isAuthenticated, async (req, res) => {
    try {
      const customers3 = await storage.getAllCustomers();
      res.json(customers3);
    } catch (error) {
      console.error("Failed to fetch customers:", error);
      res.status(500).json({ message: "Failed to fetch customers" });
    }
  });
  app2.get("/api/customers/:id", isAuthenticated, async (req, res) => {
    const customerId = parseInt(req.params.id);
    if (isNaN(customerId)) {
      return res.status(400).json({ message: "Invalid customer ID" });
    }
    try {
      const customer = await storage.getCustomer(customerId);
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }
      res.json(customer);
    } catch (error) {
      console.error(`Failed to fetch customer ${customerId}:`, error);
      res.status(500).json({ message: "Failed to fetch customer" });
    }
  });
  app2.post("/api/customers", isAuthenticated, async (req, res) => {
    try {
      const customerData = insertCustomerSchema.parse(req.body);
      const customer = await storage.createCustomer(customerData);
      res.status(201).json(customer);
    } catch (error) {
      console.error("Failed to create customer:", error);
      res.status(400).json({ message: "Invalid customer data" });
    }
  });
  app2.patch("/api/customers/:id", isAuthenticated, async (req, res) => {
    const customerId = parseInt(req.params.id);
    if (isNaN(customerId)) {
      return res.status(400).json({ message: "Invalid customer ID" });
    }
    try {
      const customerData = req.body;
      const updatedCustomer = await storage.updateCustomer(customerId, customerData);
      if (!updatedCustomer) {
        return res.status(404).json({ message: "Customer not found" });
      }
      res.json(updatedCustomer);
    } catch (error) {
      console.error(`Failed to update customer ${customerId}:`, error);
      res.status(400).json({ message: "Invalid customer data" });
    }
  });
  app2.patch("/api/customers/:id/points", isAuthenticated, async (req, res) => {
    const customerId = parseInt(req.params.id);
    if (isNaN(customerId)) {
      return res.status(400).json({ message: "Invalid customer ID" });
    }
    const pointsSchema = z2.object({
      points: z2.number().int()
    });
    try {
      const { points } = pointsSchema.parse(req.body);
      const updatedCustomer = await storage.updateCustomerPoints(customerId, points);
      if (!updatedCustomer) {
        return res.status(404).json({ message: "Customer not found" });
      }
      res.json(updatedCustomer);
    } catch (error) {
      console.error(`Failed to update customer points ${customerId}:`, error);
      res.status(400).json({ message: "Invalid points data" });
    }
  });
  app2.get("/api/categories", async (req, res) => {
    try {
      const categories3 = await storage.getAllCategories();
      res.json(categories3);
    } catch (error) {
      console.error("Failed to fetch categories:", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });
  app2.get("/api/products", async (req, res) => {
    try {
      const products3 = await storage.getAllProducts();
      res.json(products3);
    } catch (error) {
      console.error("Failed to fetch products:", error);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });
  app2.get("/api/products/category/:id", async (req, res) => {
    const categoryId = parseInt(req.params.id);
    if (isNaN(categoryId)) {
      return res.status(400).json({ message: "Invalid category ID" });
    }
    try {
      const products3 = await storage.getProductsByCategory(categoryId);
      res.json(products3);
    } catch (error) {
      console.error(`Failed to fetch products for category ${categoryId}:`, error);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });
  app2.get("/api/products/:id", async (req, res) => {
    const productId = parseInt(req.params.id);
    if (isNaN(productId)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }
    try {
      const product = await storage.getProduct(productId);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      console.error(`Failed to fetch product ${productId}:`, error);
      res.status(500).json({ message: "Failed to fetch product" });
    }
  });
  app2.post("/api/categories", isAuthenticated, async (req, res) => {
    try {
      const categoryData = insertCategorySchema.parse(req.body);
      const category = await storage.createCategory(categoryData);
      res.status(201).json(category);
    } catch (error) {
      console.error("Failed to create category:", error);
      res.status(400).json({ message: "Invalid category data" });
    }
  });
  app2.patch("/api/categories/:id", isAuthenticated, async (req, res) => {
    const categoryId = parseInt(req.params.id);
    if (isNaN(categoryId)) {
      return res.status(400).json({ message: "Invalid category ID" });
    }
    try {
      const categoryData = insertCategorySchema.parse(req.body);
      const updatedCategory = await storage.updateCategory(categoryId, categoryData);
      if (!updatedCategory) {
        return res.status(404).json({ message: "Category not found" });
      }
      res.json(updatedCategory);
    } catch (error) {
      console.error(`Failed to update category ${categoryId}:`, error);
      res.status(400).json({ message: "Invalid category data" });
    }
  });
  app2.delete("/api/categories/:id", isAuthenticated, async (req, res) => {
    const categoryId = parseInt(req.params.id);
    if (isNaN(categoryId)) {
      return res.status(400).json({ message: "Invalid category ID" });
    }
    try {
      const success = await storage.deleteCategory(categoryId);
      if (!success) {
        return res.status(400).json({
          message: "Cannot delete category that has products. Move or delete products first."
        });
      }
      res.json({ message: "Category deleted successfully" });
    } catch (error) {
      console.error(`Failed to delete category ${categoryId}:`, error);
      res.status(500).json({ message: "Failed to delete category" });
    }
  });
  app2.post("/api/products", isAuthenticated, async (req, res) => {
    try {
      const productData = insertProductSchema.parse(req.body);
      const product = await storage.createProduct(productData);
      if (product.inventory > 0) {
        await storage.createInventoryLog({
          productId: product.id,
          previousQuantity: 0,
          newQuantity: product.inventory,
          changeReason: "\uCD08\uAE30 \uC785\uACE0",
          userId: 1,
          // TODO: 실제 사용자 ID로 변경
          notes: "\uC0C1\uD488 \uC0DD\uC131 \uC2DC \uCD08\uAE30 \uC785\uACE0"
        });
      }
      res.status(201).json(product);
    } catch (error) {
      console.error("Failed to create product:", error);
      res.status(400).json({ message: "Invalid product data" });
    }
  });
  app2.patch("/api/products/:id", isAuthenticated, async (req, res) => {
    const productId = parseInt(req.params.id);
    if (isNaN(productId)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }
    try {
      const existingProduct = await storage.getProduct(productId);
      if (!existingProduct) {
        return res.status(404).json({ message: "Product not found" });
      }
      const productData = req.body;
      if (productData.inventory !== void 0 && productData.inventory !== existingProduct.inventory) {
        const updatedProduct = await storage.updateProductInventory(productId, productData.inventory);
        await storage.createInventoryLog({
          productId,
          previousQuantity: existingProduct.inventory,
          newQuantity: productData.inventory,
          changeReason: "\uC218\uB3D9 \uC870\uC815",
          userId: 1,
          // TODO: 실제 사용자 ID로 변경
          notes: "\uC0C1\uD488 \uC815\uBCF4 \uC218\uC815"
        });
        res.json(updatedProduct);
      } else {
        const updatedProduct = await storage.updateProduct(productId, productData);
        res.json(updatedProduct);
      }
    } catch (error) {
      console.error(`Failed to update product ${productId}:`, error);
      res.status(400).json({ message: "Invalid product data" });
    }
  });
  app2.get("/api/products/low-stock", isAuthenticated, async (req, res) => {
    try {
      const products3 = await storage.getLowStockProducts();
      res.json(products3);
    } catch (error) {
      console.error("Failed to fetch low stock products:", error);
      res.status(500).json({ message: "Failed to fetch low stock products" });
    }
  });
  app2.patch("/api/products/:id/inventory", isAuthenticated, async (req, res) => {
    const productId = parseInt(req.params.id);
    if (isNaN(productId)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }
    const inventorySchema = z2.object({
      inventory: z2.number().int().nonnegative(),
      reason: z2.string().optional(),
      notes: z2.string().optional()
    });
    try {
      const { inventory, reason, notes } = inventorySchema.parse(req.body);
      const product = await storage.getProduct(productId);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      const updatedProduct = await storage.updateProductInventory(productId, inventory);
      await storage.createInventoryLog({
        productId,
        previousQuantity: product.inventory,
        newQuantity: inventory,
        changeReason: reason || "\uC218\uB3D9 \uC870\uC815",
        userId: 1,
        // TODO: 실제 사용자 ID로 변경
        notes: notes || ""
      });
      res.json(updatedProduct);
    } catch (error) {
      console.error(`Failed to update product inventory ${productId}:`, error);
      res.status(400).json({ message: "Invalid inventory data" });
    }
  });
  app2.get("/api/products/:id/inventory-logs", isAuthenticated, async (req, res) => {
    const productId = parseInt(req.params.id);
    if (isNaN(productId)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }
    try {
      const inventoryLogs3 = await storage.getInventoryLogs(productId);
      res.json(inventoryLogs3);
    } catch (error) {
      console.error(`Failed to fetch inventory logs for product ${productId}:`, error);
      res.status(500).json({ message: "Failed to fetch inventory logs" });
    }
  });
  app2.get("/api/inventory-logs/recent", isAuthenticated, async (req, res) => {
    const limitSchema = z2.object({
      limit: z2.string().regex(/^\d+$/).transform(Number).optional()
    });
    try {
      const { limit } = limitSchema.parse(req.query);
      const inventoryLogs3 = await storage.getRecentInventoryLogs(limit);
      res.json(inventoryLogs3);
    } catch (error) {
      console.error("Failed to fetch recent inventory logs:", error);
      res.status(500).json({ message: "Failed to fetch inventory logs" });
    }
  });
  app2.get("/api/suppliers", isAuthenticated, async (req, res) => {
    try {
      const suppliers3 = await storage.getAllSuppliers();
      res.json(suppliers3);
    } catch (error) {
      console.error("Failed to fetch suppliers:", error);
      res.status(500).json({ message: "Failed to fetch suppliers" });
    }
  });
  app2.get("/api/suppliers/:id", isAuthenticated, async (req, res) => {
    const supplierId = parseInt(req.params.id);
    if (isNaN(supplierId)) {
      return res.status(400).json({ message: "Invalid supplier ID" });
    }
    try {
      const supplier = await storage.getSupplier(supplierId);
      if (!supplier) {
        return res.status(404).json({ message: "Supplier not found" });
      }
      res.json(supplier);
    } catch (error) {
      console.error(`Failed to fetch supplier ${supplierId}:`, error);
      res.status(500).json({ message: "Failed to fetch supplier" });
    }
  });
  app2.post("/api/suppliers", isAuthenticated, async (req, res) => {
    try {
      const supplierData = insertSupplierSchema.parse(req.body);
      const supplier = await storage.createSupplier(supplierData);
      res.status(201).json(supplier);
    } catch (error) {
      console.error("Failed to create supplier:", error);
      res.status(400).json({ message: "Invalid supplier data" });
    }
  });
  app2.patch("/api/suppliers/:id", isAuthenticated, async (req, res) => {
    const supplierId = parseInt(req.params.id);
    if (isNaN(supplierId)) {
      return res.status(400).json({ message: "Invalid supplier ID" });
    }
    try {
      const supplierData = req.body;
      const updatedSupplier = await storage.updateSupplier(supplierId, supplierData);
      if (!updatedSupplier) {
        return res.status(404).json({ message: "Supplier not found" });
      }
      res.json(updatedSupplier);
    } catch (error) {
      console.error(`Failed to update supplier ${supplierId}:`, error);
      res.status(400).json({ message: "Invalid supplier data" });
    }
  });
  app2.get("/api/purchase-orders", isAuthenticated, async (req, res) => {
    try {
      const orders = await storage.getAllPurchaseOrders();
      res.json(orders);
    } catch (error) {
      console.error("Failed to fetch purchase orders:", error);
      res.status(500).json({ message: "Failed to fetch purchase orders" });
    }
  });
  app2.get("/api/purchase-orders/:id", isAuthenticated, async (req, res) => {
    const orderId = parseInt(req.params.id);
    if (isNaN(orderId)) {
      return res.status(400).json({ message: "Invalid purchase order ID" });
    }
    try {
      const order = await storage.getPurchaseOrder(orderId);
      if (!order) {
        return res.status(404).json({ message: "Purchase order not found" });
      }
      const items = await storage.getPurchaseOrderItems(orderId);
      res.json({
        ...order,
        items
      });
    } catch (error) {
      console.error(`Failed to fetch purchase order ${orderId}:`, error);
      res.status(500).json({ message: "Failed to fetch purchase order" });
    }
  });
  app2.post("/api/purchase-orders", isAuthenticated, async (req, res) => {
    try {
      const { items, ...orderData } = req.body;
      if (!orderData.orderNumber) {
        orderData.orderNumber = `PO-${Date.now().toString().substring(3)}`;
      }
      if (!orderData.createdBy) {
        orderData.createdBy = 1;
      }
      const order = await storage.createPurchaseOrder(orderData);
      const createdItems = [];
      if (items && Array.isArray(items)) {
        for (const item of items) {
          const orderItem = await storage.addPurchaseOrderItem({
            ...item,
            purchaseOrderId: order.id
          });
          createdItems.push(orderItem);
        }
      }
      res.status(201).json({
        ...order,
        items: createdItems
      });
    } catch (error) {
      console.error("Failed to create purchase order:", error);
      res.status(400).json({ message: "Invalid purchase order data" });
    }
  });
  app2.patch("/api/purchase-orders/:id/status", isAuthenticated, async (req, res) => {
    const orderId = parseInt(req.params.id);
    if (isNaN(orderId)) {
      return res.status(400).json({ message: "Invalid purchase order ID" });
    }
    const statusSchema = z2.object({
      status: z2.enum([
        OrderStatus.DRAFT,
        OrderStatus.SUBMITTED,
        OrderStatus.PROCESSING,
        OrderStatus.COMPLETED,
        OrderStatus.CANCELLED
      ])
    });
    try {
      const { status } = statusSchema.parse(req.body);
      const updatedOrder = await storage.updatePurchaseOrderStatus(orderId, status);
      if (!updatedOrder) {
        return res.status(404).json({ message: "Purchase order not found" });
      }
      if (status === OrderStatus.COMPLETED) {
        const items = await storage.getPurchaseOrderItems(orderId);
        for (const item of items) {
          if (item.receivedQuantity > 0) {
            const product = await storage.getProduct(item.productId);
            if (product) {
              const newInventory = product.inventory + item.receivedQuantity;
              const updatedProduct = await storage.updateProductInventory(item.productId, newInventory);
              await storage.createInventoryLog({
                productId: item.productId,
                previousQuantity: product.inventory,
                newQuantity: newInventory,
                changeReason: "\uBC1C\uC8FC \uC785\uACE0",
                userId: 1,
                // TODO: 실제 사용자 ID 사용
                notes: `\uBC1C\uC8FC\uBC88\uD638: ${updatedOrder.orderNumber}`
              });
            }
          }
        }
      }
      res.json(updatedOrder);
    } catch (error) {
      console.error(`Failed to update purchase order status ${orderId}:`, error);
      res.status(400).json({ message: "Invalid status" });
    }
  });
  app2.post("/api/purchase-orders/:id/items", isAuthenticated, async (req, res) => {
    const orderId = parseInt(req.params.id);
    if (isNaN(orderId)) {
      return res.status(400).json({ message: "Invalid purchase order ID" });
    }
    try {
      const order = await storage.getPurchaseOrder(orderId);
      if (!order) {
        return res.status(404).json({ message: "Purchase order not found" });
      }
      const itemData = {
        ...req.body,
        purchaseOrderId: orderId
      };
      const item = await storage.addPurchaseOrderItem(itemData);
      res.status(201).json(item);
    } catch (error) {
      console.error(`Failed to add item to purchase order ${orderId}:`, error);
      res.status(400).json({ message: "Invalid item data" });
    }
  });
  app2.patch("/api/purchase-order-items/:id", isAuthenticated, async (req, res) => {
    const itemId = parseInt(req.params.id);
    if (isNaN(itemId)) {
      return res.status(400).json({ message: "Invalid purchase order item ID" });
    }
    try {
      const itemData = req.body;
      const updatedItem = await storage.updatePurchaseOrderItem(itemId, itemData);
      if (!updatedItem) {
        return res.status(404).json({ message: "Purchase order item not found" });
      }
      res.json(updatedItem);
    } catch (error) {
      console.error(`Failed to update purchase order item ${itemId}:`, error);
      res.status(400).json({ message: "Invalid item data" });
    }
  });
  app2.delete("/api/purchase-order-items/:id", isAuthenticated, async (req, res) => {
    const itemId = parseInt(req.params.id);
    if (isNaN(itemId)) {
      return res.status(400).json({ message: "Invalid purchase order item ID" });
    }
    try {
      const success = await storage.removePurchaseOrderItem(itemId);
      if (!success) {
        return res.status(404).json({ message: "Purchase order item not found" });
      }
      res.json({ message: "Item removed successfully" });
    } catch (error) {
      console.error(`Failed to remove purchase order item ${itemId}:`, error);
      res.status(500).json({ message: "Failed to remove item" });
    }
  });
  app2.post("/api/receipts", isAuthenticated, async (req, res) => {
    const receiptSchema = z2.object({
      items: z2.array(cartItemSchema),
      subtotal: z2.string(),
      tax: z2.string(),
      total: z2.string(),
      paymentMethod: z2.string(),
      customerId: z2.number().optional(),
      notes: z2.string().optional(),
      discount: z2.string().optional()
    });
    try {
      const { items, subtotal, tax, total, paymentMethod, customerId, notes, discount } = receiptSchema.parse(req.body);
      const receiptNumber = `SALE-${Date.now().toString().substring(3)}`;
      const userId = 1;
      const receipt = await storage.createReceipt({
        receiptNumber,
        userId,
        items,
        subtotal,
        tax,
        total,
        paymentMethod,
        customerId,
        notes,
        discount
      });
      res.status(201).json(receipt);
    } catch (error) {
      console.error("Failed to create receipt:", error);
      res.status(400).json({ message: "Invalid receipt data" });
    }
  });
  app2.get("/api/receipts", isAuthenticated, async (req, res) => {
    try {
      const receipts3 = await storage.getAllReceipts();
      res.json(receipts3);
    } catch (error) {
      console.error("Failed to fetch receipts:", error);
      res.status(500).json({ message: "Failed to fetch receipts" });
    }
  });
  app2.get("/api/receipts/:id", isAuthenticated, async (req, res) => {
    const receiptId = parseInt(req.params.id);
    if (isNaN(receiptId)) {
      return res.status(400).json({ message: "Invalid receipt ID" });
    }
    try {
      const receipt = await storage.getReceipt(receiptId);
      if (!receipt) {
        return res.status(404).json({ message: "Receipt not found" });
      }
      res.json(receipt);
    } catch (error) {
      console.error(`Failed to fetch receipt ${receiptId}:`, error);
      res.status(500).json({ message: "Failed to fetch receipt" });
    }
  });
  app2.get("/api/receipts/date-range/:start/:end", isAuthenticated, async (req, res) => {
    const { start, end } = req.params;
    const datePattern = /^\d{4}-\d{2}-\d{2}$/;
    if (!datePattern.test(start) || !datePattern.test(end)) {
      return res.status(400).json({ message: "Invalid date format. Use YYYY-MM-DD" });
    }
    try {
      const receipts3 = await storage.getReceiptsByDateRange(start, end);
      res.json(receipts3);
    } catch (error) {
      console.error(`Failed to fetch receipts for date range ${start} to ${end}:`, error);
      res.status(500).json({ message: "Failed to fetch receipts" });
    }
  });
  app2.get("/api/customers/:id/receipts", isAuthenticated, async (req, res) => {
    const customerId = parseInt(req.params.id);
    if (isNaN(customerId)) {
      return res.status(400).json({ message: "Invalid customer ID" });
    }
    try {
      const receipts3 = await storage.getReceiptsByCustomer(customerId);
      res.json(receipts3);
    } catch (error) {
      console.error(`Failed to fetch receipts for customer ${customerId}:`, error);
      res.status(500).json({ message: "Failed to fetch receipts" });
    }
  });
  app2.patch("/api/receipts/:id/status", isAuthenticated, async (req, res) => {
    const receiptId = parseInt(req.params.id);
    if (isNaN(receiptId)) {
      return res.status(400).json({ message: "Invalid receipt ID" });
    }
    const statusSchema = z2.object({
      status: z2.enum([
        TransactionStatus.COMPLETED,
        TransactionStatus.REFUNDED,
        TransactionStatus.CANCELLED,
        TransactionStatus.PENDING
      ])
    });
    try {
      const { status } = statusSchema.parse(req.body);
      const receipt = await storage.getReceipt(receiptId);
      if (!receipt) {
        return res.status(404).json({ message: "Receipt not found" });
      }
      if ((status === TransactionStatus.REFUNDED || status === TransactionStatus.CANCELLED) && receipt.status === TransactionStatus.COMPLETED) {
        const items = receipt.items;
        for (const item of items) {
          const product = await storage.getProduct(item.productId);
          if (product) {
            const newInventory = product.inventory + item.quantity;
            await storage.updateProductInventory(product.id, newInventory);
            await storage.createInventoryLog({
              productId: product.id,
              previousQuantity: product.inventory,
              newQuantity: newInventory,
              changeReason: status === TransactionStatus.REFUNDED ? "\uD658\uBD88" : "\uD310\uB9E4 \uCDE8\uC18C",
              userId: 1,
              // TODO: 실제 사용자 ID 사용
              notes: `\uC601\uC218\uC99D \uBC88\uD638: ${receipt.receiptNumber}`
            });
          }
        }
      }
      const updatedReceipt = await storage.updateReceiptStatus(receiptId, status);
      res.json(updatedReceipt);
    } catch (error) {
      console.error(`Failed to update receipt status ${receiptId}:`, error);
      res.status(400).json({ message: "Invalid status" });
    }
  });
  app2.get("/api/stats/daily/:date", isAuthenticated, async (req, res) => {
    const { date } = req.params;
    const datePattern = /^\d{4}-\d{2}-\d{2}$/;
    if (!datePattern.test(date)) {
      return res.status(400).json({ message: "Invalid date format. Use YYYY-MM-DD" });
    }
    try {
      const stats = await storage.getDailySalesStats(date);
      if (!stats) {
        return res.status(404).json({ message: "No statistics found for the given date" });
      }
      res.json(stats);
    } catch (error) {
      console.error(`Failed to fetch daily stats for ${date}:`, error);
      res.status(500).json({ message: "Failed to fetch statistics" });
    }
  });
  app2.get("/api/stats/daily/:start/:end", isAuthenticated, async (req, res) => {
    const { start, end } = req.params;
    const datePattern = /^\d{4}-\d{2}-\d{2}$/;
    if (!datePattern.test(start) || !datePattern.test(end)) {
      return res.status(400).json({ message: "Invalid date format. Use YYYY-MM-DD" });
    }
    try {
      const stats = await storage.getDailySalesStatsByRange(start, end);
      res.json(stats);
    } catch (error) {
      console.error(`Failed to fetch daily stats from ${start} to ${end}:`, error);
      res.status(500).json({ message: "Failed to fetch statistics" });
    }
  });
  app2.get("/api/stats/monthly/:month", isAuthenticated, async (req, res) => {
    const { month } = req.params;
    const monthPattern = /^\d{4}-\d{2}$/;
    if (!monthPattern.test(month)) {
      return res.status(400).json({ message: "Invalid month format. Use YYYY-MM" });
    }
    try {
      const stats = await storage.getMonthlySalesStats(month);
      if (!stats) {
        return res.status(404).json({ message: "No statistics found for the given month" });
      }
      res.json(stats);
    } catch (error) {
      console.error(`Failed to fetch monthly stats for ${month}:`, error);
      res.status(500).json({ message: "Failed to fetch statistics" });
    }
  });
  app2.get("/api/stats/monthly/:start/:end", isAuthenticated, async (req, res) => {
    const { start, end } = req.params;
    const monthPattern = /^\d{4}-\d{2}$/;
    if (!monthPattern.test(start) || !monthPattern.test(end)) {
      return res.status(400).json({ message: "Invalid month format. Use YYYY-MM" });
    }
    try {
      const stats = await storage.getMonthlySalesStatsByRange(start, end);
      res.json(stats);
    } catch (error) {
      console.error(`Failed to fetch monthly stats from ${start} to ${end}:`, error);
      res.status(500).json({ message: "Failed to fetch statistics" });
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2, { dirname as dirname2 } from "path";
import { fileURLToPath as fileURLToPath2 } from "url";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import themePlugin from "@replit/vite-plugin-shadcn-theme-json";
import path, { dirname } from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import { fileURLToPath } from "url";
var __filename = fileURLToPath(import.meta.url);
var __dirname = dirname(__filename);
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    themePlugin(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client", "src"),
      "@shared": path.resolve(__dirname, "shared")
    }
  },
  root: path.resolve(__dirname, "client"),
  build: {
    outDir: path.resolve(__dirname, "dist/public"),
    emptyOutDir: true
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var __filename2 = fileURLToPath2(import.meta.url);
var __dirname2 = dirname2(__filename2);
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        __dirname2,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(__dirname2, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = 5000;
  server.listen({
    port,
    host: "127.0.0.1",
  }, () => {
    log(`serving on port ${port}`);
  });
})();
