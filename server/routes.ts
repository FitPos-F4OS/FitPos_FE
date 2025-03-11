import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { 
  cartItemSchema, 
  insertUserSchema, 
  insertCategorySchema, 
  insertProductSchema,
  insertInventoryLogSchema,
  insertCustomerSchema,
  insertSupplierSchema,
  insertPurchaseOrderSchema,
  insertPurchaseOrderItemSchema,
  UserRole,
  ApprovalStatus
} from "@shared/schema";
import crypto from "crypto";

// 인증 검사 미들웨어
function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  // 실제 인증 로직은 auth.ts에 구현 예정
  // 현재는 임시로 모든 요청 허용
  next();
}

// 관리자 권한 검사 미들웨어 
function isAdmin(req: Request, res: Response, next: NextFunction) {
  // 실제 권한 검사 로직은 auth.ts에 구현 예정
  // 현재는 임시로 모든 요청 허용
  next();
}

export async function registerRoutes(app: Express): Promise<Server> {
  // prefix all routes with /api
  
  // ===== 사용자 관리 API =====
  
  // 모든 사용자 목록 조회
  app.get("/api/users", isAdmin, async (req: Request, res: Response) => {
    try {
      const users = await storage.getAllUsers();
      // 비밀번호와 보안 정보는 제외하고 반환
      const safeUsers = users.map(({ password, resetToken, resetTokenExpiry, ...user }) => user);
      res.json(safeUsers);
    } catch (error) {
      console.error("Failed to fetch users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });
  
  // 승인 대기 중인 사용자 목록 조회
  app.get("/api/users/pending", isAdmin, async (req: Request, res: Response) => {
    try {
      const users = await storage.getPendingUsers();
      // 비밀번호와 보안 정보는 제외하고 반환
      const safeUsers = users.map(({ password, resetToken, resetTokenExpiry, ...user }) => user);
      res.json(safeUsers);
    } catch (error) {
      console.error("Failed to fetch pending users:", error);
      res.status(500).json({ message: "Failed to fetch pending users" });
    }
  });
  
  // 사용자 계정 생성 (관리자)
  app.post("/api/users", isAdmin, async (req: Request, res: Response) => {
    try {
      // 입력 유효성 검사
      const userData = insertUserSchema.parse(req.body);
      
      // 중복 사용자 확인
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(409).json({ message: "Username already exists" });
      }
      
      const existingEmail = await storage.getUserByEmail(userData.email);
      if (existingEmail) {
        return res.status(409).json({ message: "Email already exists" });
      }
      
      // 관리자가 생성한 계정은 자동 승인
      const user = await storage.createUser({
        ...userData,
        // 임시 비밀번호 생성 (실제로는 암호화 필요)
        password: userData.password || crypto.randomBytes(8).toString('hex')
      });
      
      // 자동 승인 처리
      await storage.updateUserApprovalStatus(user.id, ApprovalStatus.APPROVED);
      
      // 비밀번호 정보는 제외하고 반환
      const { password, resetToken, resetTokenExpiry, ...safeUser } = user;
      res.status(201).json(safeUser);
    } catch (error) {
      console.error("Failed to create user:", error);
      res.status(400).json({ message: "Invalid user data" });
    }
  });
  
  // 회원가입 신청 (일반 사용자)
  app.post("/api/register", async (req: Request, res: Response) => {
    try {
      // 입력 유효성 검사
      const userData = insertUserSchema.parse(req.body);
      
      // 중복 사용자 확인
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(409).json({ message: "Username already exists" });
      }
      
      const existingEmail = await storage.getUserByEmail(userData.email);
      if (existingEmail) {
        return res.status(409).json({ message: "Email already exists" });
      }
      
      // 비밀번호 암호화 (실제로는 bcrypt 등 사용 필요)
      const user = await storage.createUser({
        ...userData,
        role: UserRole.STAFF // 기본 역할: 직원
      });
      
      // 비밀번호 정보는 제외하고 반환
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
  
  // 사용자 정보 수정
  app.patch("/api/users/:id", isAuthenticated, async (req: Request, res: Response) => {
    const userId = parseInt(req.params.id);
    if (isNaN(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }
    
    try {
      // 수정 가능한 필드만 추출
      const { username, email, fullName, phone, ...rest } = req.body;
      const updateData: Partial<typeof rest> = {};
      
      if (username) updateData.username = username;
      if (email) updateData.email = email;
      if (fullName) updateData.fullName = fullName;
      if (phone) updateData.phone = phone;
      
      const updatedUser = await storage.updateUser(userId, updateData);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // 비밀번호 정보는 제외하고 반환
      const { password, resetToken, resetTokenExpiry, ...safeUser } = updatedUser;
      res.json(safeUser);
    } catch (error) {
      console.error(`Failed to update user ${userId}:`, error);
      res.status(400).json({ message: "Invalid user data" });
    }
  });
  
  // 사용자 승인 상태 변경 (관리자)
  app.patch("/api/users/:id/approval", isAdmin, async (req: Request, res: Response) => {
    const userId = parseInt(req.params.id);
    if (isNaN(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }
    
    const approvalSchema = z.object({
      status: z.enum([ApprovalStatus.APPROVED, ApprovalStatus.REJECTED, ApprovalStatus.PENDING])
    });
    
    try {
      const { status } = approvalSchema.parse(req.body);
      const updatedUser = await storage.updateUserApprovalStatus(userId, status);
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // 비밀번호 정보는 제외하고 반환
      const { password, resetToken, resetTokenExpiry, ...safeUser } = updatedUser;
      res.json(safeUser);
    } catch (error) {
      console.error(`Failed to update user approval status ${userId}:`, error);
      res.status(400).json({ message: "Invalid approval status" });
    }
  });
  
  // 비밀번호 재설정 요청
  app.post("/api/reset-password", async (req: Request, res: Response) => {
    const resetSchema = z.object({
      email: z.string().email()
    });
    
    try {
      const { email } = resetSchema.parse(req.body);
      const user = await storage.getUserByEmail(email);
      
      if (!user) {
        // 보안상 사용자가 존재하지 않아도 동일한 응답 반환
        return res.json({ message: "Password reset link sent if email exists" });
      }
      
      // 토큰 생성
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24시간 유효
      
      await storage.updateResetToken(user.id, resetToken, resetTokenExpiry);
      
      // 실제로는 이메일 발송 로직 필요
      // 임시로 토큰만 반환
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
  
  // 비밀번호 변경
  app.post("/api/change-password", async (req: Request, res: Response) => {
    const changeSchema = z.object({
      resetToken: z.string(),
      newPassword: z.string().min(6)
    });
    
    try {
      const { resetToken, newPassword } = changeSchema.parse(req.body);
      
      // 토큰으로 사용자 찾기
      const users = await storage.getAllUsers();
      const user = users.find(u => u.resetToken === resetToken && u.resetTokenExpiry && new Date(u.resetTokenExpiry) > new Date());
      
      if (!user) {
        return res.status(400).json({ message: "Invalid or expired reset token" });
      }
      
      // 비밀번호 업데이트 (실제로는 암호화 필요)
      await storage.updateUser(user.id, { password: newPassword });
      // 토큰 초기화
      await storage.updateResetToken(user.id, null, null);
      
      res.json({ message: "Password changed successfully" });
    } catch (error) {
      console.error("Failed to change password:", error);
      res.status(400).json({ message: "Invalid request" });
    }
  });
  
  // ===== 고객 관리 API =====
  
  // 모든 고객 목록 조회
  app.get("/api/customers", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const customers = await storage.getAllCustomers();
      res.json(customers);
    } catch (error) {
      console.error("Failed to fetch customers:", error);
      res.status(500).json({ message: "Failed to fetch customers" });
    }
  });
  
  // 고객 정보 조회
  app.get("/api/customers/:id", isAuthenticated, async (req: Request, res: Response) => {
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
  
  // 고객 생성
  app.post("/api/customers", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const customerData = insertCustomerSchema.parse(req.body);
      const customer = await storage.createCustomer(customerData);
      res.status(201).json(customer);
    } catch (error) {
      console.error("Failed to create customer:", error);
      res.status(400).json({ message: "Invalid customer data" });
    }
  });
  
  // 고객 정보 수정
  app.patch("/api/customers/:id", isAuthenticated, async (req: Request, res: Response) => {
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
  
  // 고객 포인트 수정
  app.patch("/api/customers/:id/points", isAuthenticated, async (req: Request, res: Response) => {
    const customerId = parseInt(req.params.id);
    if (isNaN(customerId)) {
      return res.status(400).json({ message: "Invalid customer ID" });
    }
    
    const pointsSchema = z.object({
      points: z.number().int()
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
  
  // Get all categories
  app.get("/api/categories", async (req: Request, res: Response) => {
    try {
      const categories = await storage.getAllCategories();
      res.json(categories);
    } catch (error) {
      console.error("Failed to fetch categories:", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });
  
  // Get all products
  app.get("/api/products", async (req: Request, res: Response) => {
    try {
      const products = await storage.getAllProducts();
      res.json(products);
    } catch (error) {
      console.error("Failed to fetch products:", error);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });
  
  // Get products by category
  app.get("/api/products/category/:id", async (req: Request, res: Response) => {
    const categoryId = parseInt(req.params.id);
    if (isNaN(categoryId)) {
      return res.status(400).json({ message: "Invalid category ID" });
    }
    
    try {
      const products = await storage.getProductsByCategory(categoryId);
      res.json(products);
    } catch (error) {
      console.error(`Failed to fetch products for category ${categoryId}:`, error);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });
  
  // Get product by id
  app.get("/api/products/:id", async (req: Request, res: Response) => {
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
  
  // ===== 카테고리 관리 API =====
  
  // 새 카테고리 생성
  app.post("/api/categories", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const categoryData = insertCategorySchema.parse(req.body);
      const category = await storage.createCategory(categoryData);
      res.status(201).json(category);
    } catch (error) {
      console.error("Failed to create category:", error);
      res.status(400).json({ message: "Invalid category data" });
    }
  });
  
  // 카테고리 정보 수정
  app.patch("/api/categories/:id", isAuthenticated, async (req: Request, res: Response) => {
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
  
  // 카테고리 삭제
  app.delete("/api/categories/:id", isAuthenticated, async (req: Request, res: Response) => {
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
  
  // ===== 상품 관리 API =====
  
  // 새 상품 생성
  app.post("/api/products", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const productData = insertProductSchema.parse(req.body);
      const product = await storage.createProduct(productData);
      
      // 초기 재고 기록
      if (product.inventory > 0) {
        await storage.createInventoryLog({
          productId: product.id,
          previousQuantity: 0,
          newQuantity: product.inventory,
          changeReason: "초기 입고",
          userId: 1, // TODO: 실제 사용자 ID로 변경
          notes: "상품 생성 시 초기 입고"
        });
      }
      
      res.status(201).json(product);
    } catch (error) {
      console.error("Failed to create product:", error);
      res.status(400).json({ message: "Invalid product data" });
    }
  });
  
  // 상품 정보 수정
  app.patch("/api/products/:id", isAuthenticated, async (req: Request, res: Response) => {
    const productId = parseInt(req.params.id);
    if (isNaN(productId)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }
    
    try {
      // 기존 제품 가져오기
      const existingProduct = await storage.getProduct(productId);
      if (!existingProduct) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      // 입력 유효성 검사
      const productData = req.body;
      
      // 재고 변경이 있는 경우 재고 이력 업데이트
      if (productData.inventory !== undefined && productData.inventory !== existingProduct.inventory) {
        const updatedProduct = await storage.updateProductInventory(productId, productData.inventory);
        
        // 재고 변동 기록
        await storage.createInventoryLog({
          productId,
          previousQuantity: existingProduct.inventory,
          newQuantity: productData.inventory,
          changeReason: "수동 조정",
          userId: 1, // TODO: 실제 사용자 ID로 변경
          notes: "상품 정보 수정"
        });
        
        res.json(updatedProduct);
      } else {
        // 재고 외 다른 정보 변경
        const updatedProduct = await storage.updateProduct(productId, productData);
        res.json(updatedProduct);
      }
    } catch (error) {
      console.error(`Failed to update product ${productId}:`, error);
      res.status(400).json({ message: "Invalid product data" });
    }
  });
  
  // 재고 부족 상품 목록 조회
  app.get("/api/products/low-stock", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const products = await storage.getLowStockProducts();
      res.json(products);
    } catch (error) {
      console.error("Failed to fetch low stock products:", error);
      res.status(500).json({ message: "Failed to fetch low stock products" });
    }
  });
  
  // 상품 재고 수정
  app.patch("/api/products/:id/inventory", isAuthenticated, async (req: Request, res: Response) => {
    const productId = parseInt(req.params.id);
    if (isNaN(productId)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }
    
    const inventorySchema = z.object({
      inventory: z.number().int().nonnegative(),
      reason: z.string().optional(),
      notes: z.string().optional()
    });
    
    try {
      const { inventory, reason, notes } = inventorySchema.parse(req.body);
      
      // 기존 상품 정보 가져오기
      const product = await storage.getProduct(productId);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      // 재고 업데이트
      const updatedProduct = await storage.updateProductInventory(productId, inventory);
      
      // 재고 변동 기록
      await storage.createInventoryLog({
        productId,
        previousQuantity: product.inventory,
        newQuantity: inventory,
        changeReason: reason || "수동 조정",
        userId: 1, // TODO: 실제 사용자 ID로 변경
        notes: notes || ""
      });
      
      res.json(updatedProduct);
    } catch (error) {
      console.error(`Failed to update product inventory ${productId}:`, error);
      res.status(400).json({ message: "Invalid inventory data" });
    }
  });
  
  // 상품 재고 이력 조회
  app.get("/api/products/:id/inventory-logs", isAuthenticated, async (req: Request, res: Response) => {
    const productId = parseInt(req.params.id);
    if (isNaN(productId)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }
    
    try {
      const inventoryLogs = await storage.getInventoryLogs(productId);
      res.json(inventoryLogs);
    } catch (error) {
      console.error(`Failed to fetch inventory logs for product ${productId}:`, error);
      res.status(500).json({ message: "Failed to fetch inventory logs" });
    }
  });
  
  // 최근 재고 변동 이력 조회
  app.get("/api/inventory-logs/recent", isAuthenticated, async (req: Request, res: Response) => {
    const limitSchema = z.object({
      limit: z.string().regex(/^\d+$/).transform(Number).optional()
    });
    
    try {
      const { limit } = limitSchema.parse(req.query);
      const inventoryLogs = await storage.getRecentInventoryLogs(limit);
      res.json(inventoryLogs);
    } catch (error) {
      console.error("Failed to fetch recent inventory logs:", error);
      res.status(500).json({ message: "Failed to fetch inventory logs" });
    }
  });
  
  // ===== 공급업체 관리 API =====
  
  // 모든 공급업체 조회
  app.get("/api/suppliers", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const suppliers = await storage.getAllSuppliers();
      res.json(suppliers);
    } catch (error) {
      console.error("Failed to fetch suppliers:", error);
      res.status(500).json({ message: "Failed to fetch suppliers" });
    }
  });
  
  // 공급업체 상세 조회
  app.get("/api/suppliers/:id", isAuthenticated, async (req: Request, res: Response) => {
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
  
  // 공급업체 생성
  app.post("/api/suppliers", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const supplierData = insertSupplierSchema.parse(req.body);
      const supplier = await storage.createSupplier(supplierData);
      res.status(201).json(supplier);
    } catch (error) {
      console.error("Failed to create supplier:", error);
      res.status(400).json({ message: "Invalid supplier data" });
    }
  });
  
  // 공급업체 정보 수정
  app.patch("/api/suppliers/:id", isAuthenticated, async (req: Request, res: Response) => {
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
  
  // ===== 발주 관리 API =====
  
  // 모든 발주 조회
  app.get("/api/purchase-orders", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const orders = await storage.getAllPurchaseOrders();
      res.json(orders);
    } catch (error) {
      console.error("Failed to fetch purchase orders:", error);
      res.status(500).json({ message: "Failed to fetch purchase orders" });
    }
  });
  
  // 발주 상세 조회
  app.get("/api/purchase-orders/:id", isAuthenticated, async (req: Request, res: Response) => {
    const orderId = parseInt(req.params.id);
    if (isNaN(orderId)) {
      return res.status(400).json({ message: "Invalid purchase order ID" });
    }
    
    try {
      const order = await storage.getPurchaseOrder(orderId);
      if (!order) {
        return res.status(404).json({ message: "Purchase order not found" });
      }
      
      // 발주 항목 함께 조회
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
  
  // 발주 생성
  app.post("/api/purchase-orders", isAuthenticated, async (req: Request, res: Response) => {
    try {
      // 발주 기본 정보 생성
      const { items, ...orderData } = req.body;
      
      // 발주 번호 자동 생성
      if (!orderData.orderNumber) {
        orderData.orderNumber = `PO-${Date.now().toString().substring(3)}`;
      }
      
      // 사용자 ID는 실제 인증 시스템에서 가져와야 함 (현재는 임시로 1로 설정)
      if (!orderData.createdBy) {
        orderData.createdBy = 1;
      }
      
      const order = await storage.createPurchaseOrder(orderData);
      
      // 발주 항목 추가
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
  
  // 발주 상태 변경
  app.patch("/api/purchase-orders/:id/status", isAuthenticated, async (req: Request, res: Response) => {
    const orderId = parseInt(req.params.id);
    if (isNaN(orderId)) {
      return res.status(400).json({ message: "Invalid purchase order ID" });
    }
    
    const statusSchema = z.object({
      status: z.enum([
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
      
      // 발주가 완료(COMPLETED) 상태로 변경되면 재고 업데이트
      if (status === OrderStatus.COMPLETED) {
        const items = await storage.getPurchaseOrderItems(orderId);
        
        for (const item of items) {
          if (item.receivedQuantity > 0) {
            const product = await storage.getProduct(item.productId);
            if (product) {
              // 현재 재고에 입고된 수량 추가
              const newInventory = product.inventory + item.receivedQuantity;
              const updatedProduct = await storage.updateProductInventory(item.productId, newInventory);
              
              // 재고 변동 기록
              await storage.createInventoryLog({
                productId: item.productId,
                previousQuantity: product.inventory,
                newQuantity: newInventory,
                changeReason: "발주 입고",
                userId: 1, // TODO: 실제 사용자 ID 사용
                notes: `발주번호: ${updatedOrder.orderNumber}`
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
  
  // 발주 항목 추가
  app.post("/api/purchase-orders/:id/items", isAuthenticated, async (req: Request, res: Response) => {
    const orderId = parseInt(req.params.id);
    if (isNaN(orderId)) {
      return res.status(400).json({ message: "Invalid purchase order ID" });
    }
    
    try {
      // 발주 존재 확인
      const order = await storage.getPurchaseOrder(orderId);
      if (!order) {
        return res.status(404).json({ message: "Purchase order not found" });
      }
      
      // 항목 추가
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
  
  // 발주 항목 수정
  app.patch("/api/purchase-order-items/:id", isAuthenticated, async (req: Request, res: Response) => {
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
  
  // 발주 항목 삭제
  app.delete("/api/purchase-order-items/:id", isAuthenticated, async (req: Request, res: Response) => {
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
  
  // ===== 매출 관리 API =====
  
  // 영수증 생성
  app.post("/api/receipts", isAuthenticated, async (req: Request, res: Response) => {
    const receiptSchema = z.object({
      items: z.array(cartItemSchema),
      subtotal: z.string(),
      tax: z.string(),
      total: z.string(),
      paymentMethod: z.string(),
      customerId: z.number().optional(),
      notes: z.string().optional(),
      discount: z.string().optional()
    });
    
    try {
      const { items, subtotal, tax, total, paymentMethod, customerId, notes, discount } = receiptSchema.parse(req.body);
      
      // 영수증 번호 자동 생성
      const receiptNumber = `SALE-${Date.now().toString().substring(3)}`;
      
      // 사용자 ID는 실제 인증 시스템에서 가져와야 함 (현재는 임시로 1로 설정)
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
  
  // 모든 영수증 조회
  app.get("/api/receipts", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const receipts = await storage.getAllReceipts();
      res.json(receipts);
    } catch (error) {
      console.error("Failed to fetch receipts:", error);
      res.status(500).json({ message: "Failed to fetch receipts" });
    }
  });
  
  // 영수증 상세 조회
  app.get("/api/receipts/:id", isAuthenticated, async (req: Request, res: Response) => {
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
  
  // 날짜 범위로 영수증 조회
  app.get("/api/receipts/date-range/:start/:end", isAuthenticated, async (req: Request, res: Response) => {
    const { start, end } = req.params;
    const datePattern = /^\d{4}-\d{2}-\d{2}$/;
    
    if (!datePattern.test(start) || !datePattern.test(end)) {
      return res.status(400).json({ message: "Invalid date format. Use YYYY-MM-DD" });
    }
    
    try {
      const receipts = await storage.getReceiptsByDateRange(start, end);
      res.json(receipts);
    } catch (error) {
      console.error(`Failed to fetch receipts for date range ${start} to ${end}:`, error);
      res.status(500).json({ message: "Failed to fetch receipts" });
    }
  });
  
  // 고객별 영수증 조회
  app.get("/api/customers/:id/receipts", isAuthenticated, async (req: Request, res: Response) => {
    const customerId = parseInt(req.params.id);
    if (isNaN(customerId)) {
      return res.status(400).json({ message: "Invalid customer ID" });
    }
    
    try {
      const receipts = await storage.getReceiptsByCustomer(customerId);
      res.json(receipts);
    } catch (error) {
      console.error(`Failed to fetch receipts for customer ${customerId}:`, error);
      res.status(500).json({ message: "Failed to fetch receipts" });
    }
  });
  
  // 영수증 상태 변경 (환불/취소 처리 등)
  app.patch("/api/receipts/:id/status", isAuthenticated, async (req: Request, res: Response) => {
    const receiptId = parseInt(req.params.id);
    if (isNaN(receiptId)) {
      return res.status(400).json({ message: "Invalid receipt ID" });
    }
    
    const statusSchema = z.object({
      status: z.enum([
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
      
      // 환불이나 취소 처리 시 재고 복구
      if ((status === TransactionStatus.REFUNDED || status === TransactionStatus.CANCELLED) && 
          receipt.status === TransactionStatus.COMPLETED) {
        
        // 영수증 아이템 목록
        const items = receipt.items;
        
        // 각 아이템의 재고 복구
        for (const item of items) {
          const product = await storage.getProduct(item.productId);
          if (product) {
            const newInventory = product.inventory + item.quantity;
            await storage.updateProductInventory(product.id, newInventory);
            
            // 재고 변동 로그 기록
            await storage.createInventoryLog({
              productId: product.id,
              previousQuantity: product.inventory,
              newQuantity: newInventory,
              changeReason: status === TransactionStatus.REFUNDED ? "환불" : "판매 취소",
              userId: 1, // TODO: 실제 사용자 ID 사용
              notes: `영수증 번호: ${receipt.receiptNumber}`
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
  
  // ===== 매출 통계 API =====
  
  // 일별 매출 통계
  app.get("/api/stats/daily/:date", isAuthenticated, async (req: Request, res: Response) => {
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
  
  // 일별 매출 통계 범위 조회
  app.get("/api/stats/daily/:start/:end", isAuthenticated, async (req: Request, res: Response) => {
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
  
  // 월별 매출 통계
  app.get("/api/stats/monthly/:month", isAuthenticated, async (req: Request, res: Response) => {
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
  
  // 월별 매출 통계 범위 조회
  app.get("/api/stats/monthly/:start/:end", isAuthenticated, async (req: Request, res: Response) => {
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

  const httpServer = createServer(app);
  return httpServer;
}
