import { 
  users, User, InsertUser, UserRole, ApprovalStatus,
  categories, Category, InsertCategory,
  products, Product, InsertProduct,
  receipts, Receipt, InsertReceipt, TransactionStatus,
  customers, Customer, InsertCustomer,
  suppliers, Supplier, InsertSupplier,
  purchaseOrders, PurchaseOrder, InsertPurchaseOrder, OrderStatus,
  purchaseOrderItems, PurchaseOrderItem, InsertPurchaseOrderItem,
  inventoryLogs, InventoryLog, InsertInventoryLog,
  dailySalesStats, DailySalesStat, InsertDailySalesStat,
  monthlySalesStats, MonthlySalesStat, InsertMonthlySalesStat
} from "@shared/schema";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined>;
  updateUserApprovalStatus(id: number, status: string): Promise<User | undefined>;
  updateResetToken(id: number, token: string, expiry: Date): Promise<User | undefined>;
  getPendingUsers(): Promise<User[]>;
  getAllUsers(): Promise<User[]>;
  
  // Category methods
  getAllCategories(): Promise<Category[]>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: number, category: Partial<InsertCategory>): Promise<Category | undefined>;
  deleteCategory(id: number): Promise<boolean>;
  
  // Product methods
  getAllProducts(): Promise<Product[]>;
  getProductsByCategory(categoryId: number): Promise<Product[]>;
  getProduct(id: number): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product | undefined>;
  updateProductInventory(id: number, newInventory: number): Promise<Product | undefined>;
  getLowStockProducts(): Promise<Product[]>;
  
  // Customer methods
  getAllCustomers(): Promise<Customer[]>;
  getCustomer(id: number): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: number, customer: Partial<InsertCustomer>): Promise<Customer | undefined>;
  updateCustomerPoints(id: number, points: number): Promise<Customer | undefined>;
  
  // Supplier methods
  getAllSuppliers(): Promise<Supplier[]>;
  getSupplier(id: number): Promise<Supplier | undefined>;
  createSupplier(supplier: InsertSupplier): Promise<Supplier>;
  updateSupplier(id: number, supplier: Partial<InsertSupplier>): Promise<Supplier | undefined>;
  
  // Purchase order methods
  getAllPurchaseOrders(): Promise<PurchaseOrder[]>;
  getPurchaseOrder(id: number): Promise<PurchaseOrder | undefined>;
  createPurchaseOrder(order: InsertPurchaseOrder): Promise<PurchaseOrder>;
  updatePurchaseOrderStatus(id: number, status: string): Promise<PurchaseOrder | undefined>;
  
  // Purchase order item methods
  getPurchaseOrderItems(orderId: number): Promise<PurchaseOrderItem[]>;
  addPurchaseOrderItem(item: InsertPurchaseOrderItem): Promise<PurchaseOrderItem>;
  updatePurchaseOrderItem(id: number, item: Partial<InsertPurchaseOrderItem>): Promise<PurchaseOrderItem | undefined>;
  removePurchaseOrderItem(id: number): Promise<boolean>;
  
  // Inventory log methods
  createInventoryLog(log: InsertInventoryLog): Promise<InventoryLog>;
  getInventoryLogs(productId: number): Promise<InventoryLog[]>;
  getRecentInventoryLogs(limit?: number): Promise<InventoryLog[]>;
  
  // Receipt methods
  createReceipt(receipt: InsertReceipt): Promise<Receipt>;
  getReceipt(id: number): Promise<Receipt | undefined>;
  getAllReceipts(): Promise<Receipt[]>;
  getReceiptsByDateRange(startDate: string, endDate: string): Promise<Receipt[]>;
  getReceiptsByCustomer(customerId: number): Promise<Receipt[]>;
  updateReceiptStatus(id: number, status: string): Promise<Receipt | undefined>;
  
  // Sales stats methods
  getDailySalesStats(date: string): Promise<DailySalesStat | undefined>;
  createOrUpdateDailySalesStats(stats: InsertDailySalesStat): Promise<DailySalesStat>;
  getDailySalesStatsByRange(startDate: string, endDate: string): Promise<DailySalesStat[]>;
  
  getMonthlySalesStats(month: string): Promise<MonthlySalesStat | undefined>;
  createOrUpdateMonthlySalesStats(stats: InsertMonthlySalesStat): Promise<MonthlySalesStat>;
  getMonthlySalesStatsByRange(startMonth: string, endMonth: string): Promise<MonthlySalesStat[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private categories: Map<number, Category>;
  private products: Map<number, Product>;
  private receipts: Map<number, Receipt>;
  private customers: Map<number, Customer>;
  private suppliers: Map<number, Supplier>;
  private purchaseOrders: Map<number, PurchaseOrder>;
  private purchaseOrderItems: Map<number, PurchaseOrderItem>;
  private inventoryLogs: Map<number, InventoryLog>;
  private dailySalesStats: Map<string, DailySalesStat>;
  private monthlySalesStats: Map<string, MonthlySalesStat>;
  
  private userIdCounter: number;
  private categoryIdCounter: number;
  private productIdCounter: number;
  private receiptIdCounter: number;
  private customerIdCounter: number;
  private supplierIdCounter: number;
  private purchaseOrderIdCounter: number;
  private purchaseOrderItemIdCounter: number;
  private inventoryLogIdCounter: number;
  private dailySalesStatsIdCounter: number;
  private monthlySalesStatsIdCounter: number;

  constructor() {
    this.users = new Map();
    this.categories = new Map();
    this.products = new Map();
    this.receipts = new Map();
    this.customers = new Map();
    this.suppliers = new Map();
    this.purchaseOrders = new Map();
    this.purchaseOrderItems = new Map();
    this.inventoryLogs = new Map();
    this.dailySalesStats = new Map();
    this.monthlySalesStats = new Map();
    
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
    
    // Initialize with sample data
    this.initializeSampleData();
  }

  private initializeSampleData() {
    // 샘플 관리자 계정 생성
    this.createUser({
      username: "admin",
      password: "admin123",
      email: "admin@fitpos.com",
      fullName: "관리자",
      role: UserRole.ADMIN,
      phone: "010-1234-5678"
    });
    
    // 샘플 직원 계정 생성
    this.createUser({
      username: "staff",
      password: "staff123",
      email: "staff@fitpos.com",
      fullName: "직원",
      role: UserRole.STAFF,
      phone: "010-2345-6789"
    });
    
    // 대기 중인 승인 요청 계정 생성
    const pendingUser = this.createUser({
      username: "newstaff",
      password: "newstaff123",
      email: "newstaff@fitpos.com",
      fullName: "신규직원",
      role: UserRole.STAFF,
      phone: "010-3456-7890"
    });
    
    // 샘플 고객 데이터 생성
    this.createCustomer({
      fullName: "김고객",
      email: "customer1@example.com",
      phone: "010-1111-2222",
      membershipLevel: "gold",
      points: 150
    });
    
    this.createCustomer({
      fullName: "이회원",
      email: "customer2@example.com",
      phone: "010-2222-3333",
      membershipLevel: "silver",
      points: 75
    });
    
    // 샘플 공급업체 생성
    this.createSupplier({
      name: "피트니스 용품 도매",
      contactName: "박공급",
      email: "supplier1@example.com",
      phone: "02-123-4567",
      address: "서울시 강남구 역삼동 123-45"
    });
    
    this.createSupplier({
      name: "건강식품 공급사",
      contactName: "최벤더",
      email: "supplier2@example.com", 
      phone: "02-234-5678",
      address: "서울시 마포구 망원동 234-56"
    });
    
    // 카테고리 생성
    const categoriesData: InsertCategory[] = [
      { name: "운동 장비" },
      { name: "단백질 보충제" },
      { name: "운동복" },
      { name: "액세서리" },
      { name: "영양제" },
      { name: "피트니스 기기" }
    ];
    
    categoriesData.forEach(cat => this.createCategory(cat));
    
    // 샘플 상품 생성
    const now = new Date();
    const productsData: InsertProduct[] = [
      { 
        name: "프리미엄 덤벨 세트", 
        description: "고급 스테인리스 스틸 덤벨 세트 (2kg-10kg)",
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
        name: "피트니스 트래커", 
        description: "심박수 및 활동량 측정 스마트 피트니스 트래커",
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
        name: "남성용 런닝 티셔츠", 
        description: "통기성 좋은 기능성 런닝 티셔츠",
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
        name: "여성용 요가 레깅스", 
        description: "신축성 좋은 프리미엄 요가 레깅스",
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
        name: "프로틴 파우더 1kg", 
        description: "고품질 단백질 보충제 1kg",
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
        name: "휴대용 폼롤러", 
        description: "운동 후 근육 이완을 위한 폼롤러",
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
        name: "스포츠 물병", 
        description: "BPA-free 800ml 스포츠 물병",
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
        name: "운동용 장갑", 
        description: "무게 트레이닝용 장갑 (M 사이즈)",
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
        name: "멀티비타민 (60정)", 
        description: "종합비타민 영양제 60정",
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
        name: "단백질 바 (12개입)", 
        description: "고단백 저당 프로틴 바 12개 세트",
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
    
    // 상품 데이터 생성
    const products: Product[] = [];
    for (const product of productsData) {
      const newProduct = this.createProduct(product);
      products.push(newProduct);
    }
    
    // 재고 이력 생성
    products.forEach(product => {
      this.createInventoryLog({
        productId: product.id,
        previousQuantity: 0,
        newQuantity: product.inventory,
        changeReason: "초기 입고",
        userId: 1,
        notes: "시스템 초기화 입고"
      });
    });
    
    // 샘플 발주서 생성
    const order = this.createPurchaseOrder({
      orderNumber: "PO-" + new Date().getTime().toString().substring(5),
      supplierId: 1,
      status: OrderStatus.COMPLETED,
      totalAmount: "495.00",
      expectedDeliveryDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
      createdBy: 1,
      notes: "월간 재고 보충 발주"
    });
    
    // 발주 항목 생성
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
    
    // 샘플 영수증 생성
    const receipt1 = this.createReceipt({
      receiptNumber: "SALE-" + new Date().getTime().toString().substring(5),
      customerId: 1,
      userId: 1,
      items: [
        {
          productId: 1,
          name: "프리미엄 덤벨 세트",
          price: "89.99",
          imageUrl: "https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2",
          quantity: 1
        },
        {
          productId: 7,
          name: "스포츠 물병",
          price: "24.99",
          imageUrl: "https://images.unsplash.com/photo-1594223274512-ad4803739b7c",
          quantity: 1
        }
      ],
      subtotal: "114.98",
      tax: "11.50",
      total: "126.48",
      paymentMethod: "신용카드",
      status: TransactionStatus.COMPLETED,
      notes: "첫 구매 고객"
    });
    
    const receipt2 = this.createReceipt({
      receiptNumber: "SALE-" + (new Date().getTime() + 1).toString().substring(5),
      customerId: 2,
      userId: 2,
      items: [
        {
          productId: 5,
          name: "프로틴 파우더 1kg",
          price: "79.99",
          imageUrl: "https://images.unsplash.com/photo-1579722821273-0f6c1a44d548",
          quantity: 1
        }
      ],
      subtotal: "79.99",
      tax: "8.00",
      total: "87.99",
      paymentMethod: "현금",
      status: TransactionStatus.COMPLETED,
      notes: ""
    });
    
    // 일일/월간 매출 통계 생성
    const today = new Date().toISOString().split('T')[0];
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
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const now = new Date();
    
    // 기본값 설정
    const user: User = { 
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
  
  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  async updateUserApprovalStatus(id: number, status: string): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, approvalStatus: status };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  async updateResetToken(id: number, token: string, expiry: Date): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { 
      ...user, 
      resetToken: token,
      resetTokenExpiry: expiry
    };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  async getPendingUsers(): Promise<User[]> {
    return Array.from(this.users.values()).filter(
      (user) => user.approvalStatus === ApprovalStatus.PENDING
    );
  }
  
  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }
  
  // Customer methods
  async getAllCustomers(): Promise<Customer[]> {
    return Array.from(this.customers.values());
  }
  
  async getCustomer(id: number): Promise<Customer | undefined> {
    return this.customers.get(id);
  }
  
  async createCustomer(customer: InsertCustomer): Promise<Customer> {
    const id = this.customerIdCounter++;
    const now = new Date();
    
    const newCustomer: Customer = {
      ...customer,
      id,
      createdAt: now,
      lastVisit: null
    };
    
    this.customers.set(id, newCustomer);
    return newCustomer;
  }
  
  async updateCustomer(id: number, customer: Partial<InsertCustomer>): Promise<Customer | undefined> {
    const existingCustomer = this.customers.get(id);
    if (!existingCustomer) return undefined;
    
    const updatedCustomer = { ...existingCustomer, ...customer };
    this.customers.set(id, updatedCustomer);
    return updatedCustomer;
  }
  
  async updateCustomerPoints(id: number, points: number): Promise<Customer | undefined> {
    const customer = this.customers.get(id);
    if (!customer) return undefined;
    
    const updatedCustomer = { 
      ...customer, 
      points: (customer.points || 0) + points 
    };
    this.customers.set(id, updatedCustomer);
    return updatedCustomer;
  }
  
  // Category methods
  async getAllCategories(): Promise<Category[]> {
    return Array.from(this.categories.values());
  }
  
  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const id = this.categoryIdCounter++;
    const category: Category = { ...insertCategory, id };
    this.categories.set(id, category);
    return category;
  }
  
  async updateCategory(id: number, category: Partial<InsertCategory>): Promise<Category | undefined> {
    const existingCategory = this.categories.get(id);
    if (!existingCategory) return undefined;
    
    const updatedCategory = { ...existingCategory, ...category };
    this.categories.set(id, updatedCategory);
    return updatedCategory;
  }
  
  async deleteCategory(id: number): Promise<boolean> {
    // 카테고리에 속한 상품이 있는지 확인
    const products = await this.getProductsByCategory(id);
    if (products.length > 0) {
      return false; // 상품이 있으면 삭제 불가
    }
    
    return this.categories.delete(id);
  }
  
  // Product methods
  async getAllProducts(): Promise<Product[]> {
    return Array.from(this.products.values());
  }
  
  async getProductsByCategory(categoryId: number): Promise<Product[]> {
    return Array.from(this.products.values()).filter(
      (product) => product.categoryId === categoryId
    );
  }
  
  async getProduct(id: number): Promise<Product | undefined> {
    return this.products.get(id);
  }
  
  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const id = this.productIdCounter++;
    const now = new Date();
    
    const product: Product = { 
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
  
  async updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product | undefined> {
    const existingProduct = this.products.get(id);
    if (!existingProduct) return undefined;
    
    const now = new Date();
    const updatedProduct = { 
      ...existingProduct, 
      ...product,
      updatedAt: now
    };
    
    this.products.set(id, updatedProduct);
    return updatedProduct;
  }
  
  async updateProductInventory(id: number, newInventory: number): Promise<Product | undefined> {
    const product = this.products.get(id);
    if (!product) return undefined;
    
    // 이전 재고 저장
    const previousQuantity = product.inventory;
    
    const now = new Date();
    const updatedProduct = { 
      ...product, 
      inventory: newInventory,
      updatedAt: now 
    };
    
    this.products.set(id, updatedProduct);
    return updatedProduct;
  }
  
  async getLowStockProducts(): Promise<Product[]> {
    return Array.from(this.products.values()).filter(
      product => product.inventory <= (product.minStockLevel || 0)
    );
  }
  
  // Inventory log methods
  async createInventoryLog(log: InsertInventoryLog): Promise<InventoryLog> {
    const id = this.inventoryLogIdCounter++;
    const now = new Date();
    
    const inventoryLog: InventoryLog = { 
      ...log, 
      id,
      timestamp: log.timestamp || now
    };
    
    this.inventoryLogs.set(id, inventoryLog);
    return inventoryLog;
  }
  
  async getInventoryLogs(productId: number): Promise<InventoryLog[]> {
    return Array.from(this.inventoryLogs.values())
      .filter(log => log.productId === productId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }
  
  async getRecentInventoryLogs(limit: number = 20): Promise<InventoryLog[]> {
    return Array.from(this.inventoryLogs.values())
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }
  
  // Supplier methods
  async getAllSuppliers(): Promise<Supplier[]> {
    return Array.from(this.suppliers.values());
  }
  
  async getSupplier(id: number): Promise<Supplier | undefined> {
    return this.suppliers.get(id);
  }
  
  async createSupplier(supplier: InsertSupplier): Promise<Supplier> {
    const id = this.supplierIdCounter++;
    const now = new Date();
    
    const newSupplier: Supplier = {
      ...supplier,
      id,
      createdAt: now,
      isActive: supplier.isActive !== undefined ? supplier.isActive : true
    };
    
    this.suppliers.set(id, newSupplier);
    return newSupplier;
  }
  
  async updateSupplier(id: number, supplier: Partial<InsertSupplier>): Promise<Supplier | undefined> {
    const existingSupplier = this.suppliers.get(id);
    if (!existingSupplier) return undefined;
    
    const updatedSupplier = { ...existingSupplier, ...supplier };
    this.suppliers.set(id, updatedSupplier);
    return updatedSupplier;
  }
  
  // Purchase order methods
  async getAllPurchaseOrders(): Promise<PurchaseOrder[]> {
    return Array.from(this.purchaseOrders.values());
  }
  
  async getPurchaseOrder(id: number): Promise<PurchaseOrder | undefined> {
    return this.purchaseOrders.get(id);
  }
  
  async createPurchaseOrder(order: InsertPurchaseOrder): Promise<PurchaseOrder> {
    const id = this.purchaseOrderIdCounter++;
    const now = new Date();
    
    const newOrder: PurchaseOrder = {
      ...order,
      id,
      createdAt: now,
      updatedAt: null,
      status: order.status || OrderStatus.DRAFT
    };
    
    this.purchaseOrders.set(id, newOrder);
    return newOrder;
  }
  
  async updatePurchaseOrderStatus(id: number, status: string): Promise<PurchaseOrder | undefined> {
    const order = this.purchaseOrders.get(id);
    if (!order) return undefined;
    
    const now = new Date();
    const updatedOrder = { 
      ...order, 
      status,
      updatedAt: now
    };
    
    this.purchaseOrders.set(id, updatedOrder);
    return updatedOrder;
  }
  
  // Purchase order item methods
  async getPurchaseOrderItems(orderId: number): Promise<PurchaseOrderItem[]> {
    return Array.from(this.purchaseOrderItems.values())
      .filter(item => item.purchaseOrderId === orderId);
  }
  
  async addPurchaseOrderItem(item: InsertPurchaseOrderItem): Promise<PurchaseOrderItem> {
    const id = this.purchaseOrderItemIdCounter++;
    
    const newItem: PurchaseOrderItem = {
      ...item,
      id,
      receivedQuantity: item.receivedQuantity || 0
    };
    
    this.purchaseOrderItems.set(id, newItem);
    
    // 발주 총액 업데이트
    const order = this.purchaseOrders.get(item.purchaseOrderId);
    if (order) {
      const totalAmount = parseFloat(order.totalAmount) + parseFloat(item.totalPrice);
      this.updatePurchaseOrderStatus(order.id, order.status);
    }
    
    return newItem;
  }
  
  async updatePurchaseOrderItem(id: number, itemData: Partial<InsertPurchaseOrderItem>): Promise<PurchaseOrderItem | undefined> {
    const item = this.purchaseOrderItems.get(id);
    if (!item) return undefined;
    
    const updatedItem = { ...item, ...itemData };
    this.purchaseOrderItems.set(id, updatedItem);
    
    // 발주 총액 업데이트
    if (itemData.totalPrice) {
      const order = this.purchaseOrders.get(item.purchaseOrderId);
      if (order) {
        const allItems = await this.getPurchaseOrderItems(order.id);
        const totalAmount = allItems.reduce((sum, curr) => sum + parseFloat(curr.totalPrice), 0).toFixed(2);
        
        this.purchaseOrders.set(order.id, {
          ...order,
          totalAmount,
          updatedAt: new Date()
        });
      }
    }
    
    return updatedItem;
  }
  
  async removePurchaseOrderItem(id: number): Promise<boolean> {
    const item = this.purchaseOrderItems.get(id);
    if (!item) return false;
    
    const success = this.purchaseOrderItems.delete(id);
    
    // 발주 총액 업데이트
    if (success) {
      const order = this.purchaseOrders.get(item.purchaseOrderId);
      if (order) {
        const allItems = await this.getPurchaseOrderItems(order.id);
        const totalAmount = allItems.reduce((sum, curr) => sum + parseFloat(curr.totalPrice), 0).toFixed(2);
        
        this.purchaseOrders.set(order.id, {
          ...order,
          totalAmount,
          updatedAt: new Date()
        });
      }
    }
    
    return success;
  }
  
  // Receipt methods
  async createReceipt(insertReceipt: InsertReceipt): Promise<Receipt> {
    const id = this.receiptIdCounter++;
    const now = new Date();
    
    const receipt: Receipt = { 
      ...insertReceipt, 
      id,
      createdAt: now,
      updatedAt: null,
      status: insertReceipt.status || TransactionStatus.COMPLETED,
      notes: insertReceipt.notes || null,
      discount: insertReceipt.discount || "0",
      customerId: insertReceipt.customerId || null
    };
    
    this.receipts.set(id, receipt);
    
    // 재고 업데이트
    if (insertReceipt.items && Array.isArray(insertReceipt.items)) {
      for (const item of insertReceipt.items) {
        const product = await this.getProduct(item.productId);
        if (product) {
          const newInventory = Math.max(0, product.inventory - item.quantity);
          await this.updateProductInventory(product.id, newInventory);
          
          // 재고 변경 로그 생성
          await this.createInventoryLog({
            productId: product.id,
            previousQuantity: product.inventory,
            newQuantity: newInventory,
            changeReason: "판매",
            userId: insertReceipt.userId,
            notes: `영수증 번호: ${insertReceipt.receiptNumber}`
          });
        }
      }
    }
    
    // 고객 포인트 업데이트
    if (insertReceipt.customerId) {
      const totalAmount = parseFloat(insertReceipt.total);
      const earnedPoints = Math.floor(totalAmount / 100); // 100원당 1포인트
      await this.updateCustomerPoints(insertReceipt.customerId, earnedPoints);
      
      // 고객 마지막 방문일 업데이트
      const customer = await this.getCustomer(insertReceipt.customerId);
      if (customer) {
        this.customers.set(insertReceipt.customerId, {
          ...customer,
          lastVisit: now
        });
      }
    }
    
    // 일일 매출 통계 업데이트
    const date = now.toISOString().split('T')[0];
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
    
    // 월간 매출 통계 업데이트
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
  
  async getReceipt(id: number): Promise<Receipt | undefined> {
    return this.receipts.get(id);
  }
  
  async getAllReceipts(): Promise<Receipt[]> {
    return Array.from(this.receipts.values());
  }
  
  async getReceiptsByDateRange(startDate: string, endDate: string): Promise<Receipt[]> {
    return Array.from(this.receipts.values()).filter(receipt => {
      if (typeof receipt.createdAt === 'string') {
        return receipt.createdAt >= startDate && receipt.createdAt <= endDate;
      } else {
        const date = receipt.createdAt.toISOString().split('T')[0];
        return date >= startDate && date <= endDate;
      }
    });
  }
  
  async getReceiptsByCustomer(customerId: number): Promise<Receipt[]> {
    return Array.from(this.receipts.values()).filter(
      receipt => receipt.customerId === customerId
    );
  }
  
  async updateReceiptStatus(id: number, status: string): Promise<Receipt | undefined> {
    const receipt = this.receipts.get(id);
    if (!receipt) return undefined;
    
    const now = new Date();
    const updatedReceipt = { 
      ...receipt, 
      status,
      updatedAt: now
    };
    
    this.receipts.set(id, updatedReceipt);
    return updatedReceipt;
  }
  
  // Sales stats methods
  async getDailySalesStats(date: string): Promise<DailySalesStat | undefined> {
    return this.dailySalesStats.get(date);
  }
  
  async createOrUpdateDailySalesStats(stats: InsertDailySalesStat): Promise<DailySalesStat> {
    const id = this.dailySalesStatsIdCounter++;
    const existingStats = await this.getDailySalesStats(stats.date);
    
    if (existingStats) {
      const updatedStats = { ...existingStats, ...stats };
      this.dailySalesStats.set(stats.date, updatedStats);
      return updatedStats;
    } else {
      const newStats: DailySalesStat = { ...stats, id };
      this.dailySalesStats.set(stats.date, newStats);
      return newStats;
    }
  }
  
  async updateDailySalesStats(date: string, update: Partial<InsertDailySalesStat>): Promise<DailySalesStat | undefined> {
    const stats = this.dailySalesStats.get(date);
    if (!stats) return undefined;
    
    // 평균 거래 금액 계산
    if (update.totalSales && update.totalTransactions) {
      const avgValue = (parseFloat(update.totalSales) / update.totalTransactions).toFixed(2);
      update.avgTransactionValue = avgValue;
    }
    
    const updatedStats = { ...stats, ...update };
    this.dailySalesStats.set(date, updatedStats);
    return updatedStats;
  }
  
  async getDailySalesStatsByRange(startDate: string, endDate: string): Promise<DailySalesStat[]> {
    return Array.from(this.dailySalesStats.values()).filter(
      stats => stats.date >= startDate && stats.date <= endDate
    );
  }
  
  async getMonthlySalesStats(month: string): Promise<MonthlySalesStat | undefined> {
    return this.monthlySalesStats.get(month);
  }
  
  async createOrUpdateMonthlySalesStats(stats: InsertMonthlySalesStat): Promise<MonthlySalesStat> {
    const id = this.monthlySalesStatsIdCounter++;
    const existingStats = await this.getMonthlySalesStats(stats.month);
    
    if (existingStats) {
      const updatedStats = { ...existingStats, ...stats };
      this.monthlySalesStats.set(stats.month, updatedStats);
      return updatedStats;
    } else {
      const newStats: MonthlySalesStat = { ...stats, id };
      this.monthlySalesStats.set(stats.month, newStats);
      return newStats;
    }
  }
  
  async updateMonthlySalesStats(month: string, update: Partial<InsertMonthlySalesStat>): Promise<MonthlySalesStat | undefined> {
    const stats = this.monthlySalesStats.get(month);
    if (!stats) return undefined;
    
    // 평균 거래 금액 계산
    if (update.totalSales && update.totalTransactions) {
      const avgValue = (parseFloat(update.totalSales) / update.totalTransactions).toFixed(2);
      update.avgTransactionValue = avgValue;
    }
    
    const updatedStats = { ...stats, ...update };
    this.monthlySalesStats.set(month, updatedStats);
    return updatedStats;
  }
  
  async getMonthlySalesStatsByRange(startMonth: string, endMonth: string): Promise<MonthlySalesStat[]> {
    return Array.from(this.monthlySalesStats.values()).filter(
      stats => stats.month >= startMonth && stats.month <= endMonth
    );
  }
}

export const storage = new MemStorage();
